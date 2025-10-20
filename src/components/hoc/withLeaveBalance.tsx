import React, { useState, useEffect } from 'react';
import { employeeAPI, managerAPI, adminAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import LeaveBalanceOverviewCard from '@/components/ui/LeaveBalanceOverviewCard';

interface LeaveBalanceData {
  [key: string]: {
    total: number;
    used: number;
    remaining: number;
  };
}

interface WithLeaveBalanceProps {
  leaveBalance?: LeaveBalanceData;
  loading?: boolean;
  error?: string | null;
  refreshLeaveBalance?: () => Promise<void>;
}

interface WithLeaveBalanceOptions {
  autoFetch?: boolean;
  cacheTimeout?: number;
  showProgress?: boolean;
  customTitle?: string;
  customDescription?: string;
  employeeId?: string; // For fetching team member's leave balance
}

// Higher-Order Component for Leave Balance
export function withLeaveBalance<P extends object>(
  WrappedComponent: React.ComponentType<P & WithLeaveBalanceProps>,
  options: WithLeaveBalanceOptions = {}
) {
  const {
    autoFetch = true,
    cacheTimeout = 30000, // 30 seconds
    showProgress = true,
    customTitle,
    customDescription,
    employeeId
  } = options;

  return function WithLeaveBalanceComponent(props: P) {
    const { user } = useAuth();
    const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceData>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetch, setLastFetch] = useState<number>(0);

    const fetchLeaveBalance = async (forceRefresh = false) => {
      if (!user) return;

      // Check cache timeout
      const now = Date.now();
      if (!forceRefresh && now - lastFetch < cacheTimeout) {
        console.log('🔍 withLeaveBalance: Using cached data');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 withLeaveBalance: Fetching leave balance for user:', user.role, employeeId ? `(team member: ${employeeId})` : '');
        
        let response;
        const timestamp = Date.now();
        
        // If employeeId is provided, fetch team member's leave balance
        if (employeeId) {
          response = await managerAPI.getTeamMemberLeaveBalance(employeeId);
        } else {
          // Fetch based on user role
          switch (user.role) {
            case 'employee':
              response = await employeeAPI.getLeaveBalance({ _t: timestamp } as Record<string, unknown>);
              break;
            case 'manager':
              response = await managerAPI.getLeaveBalance({ _t: timestamp } as Record<string, unknown>);
              break;
            case 'admin':
              response = await adminAPI.getUserLeaveBalance(user.id);
              break;
            default:
              throw new Error('Invalid user role');
          }
        }

        if (response.success && response.data) {
          const balance = response.data;
          console.log('✅ withLeaveBalance: Leave balance fetched:', balance);
          console.log('✅ withLeaveBalance: Balance type:', typeof balance);
          console.log('✅ withLeaveBalance: Balance keys:', Object.keys(balance));
          
          // Process the balance data to match our interface
          const processedBalance: LeaveBalanceData = {};
          
          if (typeof balance === 'object' && balance !== null) {
            // Handle team member leave balance structure
            if (employeeId && balance.leaveBalance) {
              console.log('✅ withLeaveBalance: Processing team member leave balance:', balance.leaveBalance);
              Object.entries(balance.leaveBalance).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null && 'total' in value && 'used' in value && 'remaining' in value) {
                  processedBalance[key] = {
                    total: Number(value.total) || 0,
                    used: Number(value.used) || 0,
                    remaining: Number(value.remaining) || 0
                  };
                }
              });
            } else {
              // Handle regular user leave balance structure
              Object.entries(balance).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null && 'total' in value && 'used' in value && 'remaining' in value) {
                  processedBalance[key] = {
                    total: Number(value.total) || 0,
                    used: Number(value.used) || 0,
                    remaining: Number(value.remaining) || 0
                  };
                }
              });
            }
          }
          
          console.log('✅ withLeaveBalance: Processed balance:', processedBalance);
          setLeaveBalance(processedBalance);
          setLastFetch(now);
        } else {
          throw new Error(response.message || 'Failed to fetch leave balance');
        }
      } catch (err) {
        console.error('❌ withLeaveBalance: Error fetching leave balance:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch leave balance');
      } finally {
        setLoading(false);
      }
    };

    const refreshLeaveBalance = async () => {
      await fetchLeaveBalance(true);
    };

    // Auto-fetch on mount and when user or employeeId changes
    useEffect(() => {
      if (autoFetch && user) {
        fetchLeaveBalance();
      }
    }, [user, autoFetch, employeeId]);

    // Pass the leave balance data and methods to the wrapped component
    const hocProps: WithLeaveBalanceProps = {
      leaveBalance,
      loading,
      error,
      refreshLeaveBalance
    };

    return <WrappedComponent {...props} {...hocProps} />;
  };
}

// Standalone Leave Balance Card Component using the HOC
export const LeaveBalanceCard = withLeaveBalance(
  ({ leaveBalance, loading, error, refreshLeaveBalance, ...props }: WithLeaveBalanceProps & Record<string, unknown>) => {
    if (loading) {
      return (
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-sm"></div>
          <div className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-2xl bg-gray-100">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded mb-2"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-3xl blur-sm"></div>
          <div className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl p-6">
            <div className="text-center py-8">
              <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-red-500 text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Error Loading Leave Balance</h3>
              <p className="text-slate-500 mb-4">{error}</p>
              <button
                onClick={refreshLeaveBalance}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <LeaveBalanceOverviewCard
        leaveBalance={leaveBalance}
        showProgress={true}
        {...props}
      />
    );
  },
  {
    autoFetch: true,
    cacheTimeout: 30000,
    showProgress: true
  }
);

// Team Member Leave Balance Card Component
export const TeamMemberLeaveBalanceCard = ({ employeeId, customTitle, customDescription }: { 
  employeeId: string; 
  customTitle?: string; 
  customDescription?: string; 
}) => {
  const TeamMemberCard = withLeaveBalance(
    ({ leaveBalance, loading, error, refreshLeaveBalance, ...props }: WithLeaveBalanceProps & Record<string, unknown>) => {
      if (loading) {
        return (
          <div className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl rounded-3xl p-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-muted-foreground">Loading leave balance...</span>
            </div>
          </div>
        );
      }

      if (error) {
        return (
          <div className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl rounded-3xl p-6">
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">⚠️ Error loading leave balance</div>
              <button 
                onClick={refreshLeaveBalance}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Retry
              </button>
            </div>
          </div>
        );
      }

      return (
        <LeaveBalanceOverviewCard
          leaveBalance={leaveBalance}
          title={customTitle || "Leave Balance"}
          description={customDescription || "Team member's current leave balance"}
          {...props}
        />
      );
    },
    {
      autoFetch: true,
      cacheTimeout: 30000,
      showProgress: true,
      employeeId: employeeId
    }
  );

  return <TeamMemberCard />;
};

export default withLeaveBalance;
