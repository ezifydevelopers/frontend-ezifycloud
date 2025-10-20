import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { managerAPI, adminAPI, employeeAPI } from '@/lib/api';

// Centralized dashboard data interface
export interface DashboardData {
  // Team Statistics
  totalTeamMembers: number;
  activeTeamMembers: number;
  onLeaveToday: number;
  presentToday: number;
  
  // Leave Request Statistics  
  pendingApprovals: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  totalRequests: number;
  
  // Capacity Metrics
  teamCapacity: number;
  attendanceRate: number;
  utilizationRate: number;
  
  // Additional Data
  upcomingLeaves: Array<{
    id: string;
    memberName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    days: number;
    status: string;
  }>;
  
  recentRequests: Array<{
    id: string;
    employeeName: string;
    leaveType: string;
    status: string;
    days: number;
    startDate: string;
    endDate: string;
    submittedAt: string;
    priority: string;
  }>;
  
  // Loading and Error States
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface WithDashboardDataProps {
  dashboardData: DashboardData;
  refreshDashboardData: () => Promise<void>;
  isRefreshing: boolean;
}

export interface WithDashboardDataOptions {
  autoFetch?: boolean;
  refreshInterval?: number; // in milliseconds
  cacheTimeout?: number; // in milliseconds
}

// Cache for dashboard data
let dashboardDataCache: {
  data: DashboardData | null;
  timestamp: number;
  userRole: string | null;
} = {
  data: null,
  timestamp: 0,
  userRole: null
};

export function withDashboardData<P extends object>(
  WrappedComponent: React.ComponentType<P & WithDashboardDataProps>,
  options: WithDashboardDataOptions = {}
) {
  const {
    autoFetch = true,
    refreshInterval = 30000, // 30 seconds
    cacheTimeout = 60000 // 1 minute
  } = options;

  return function WithDashboardDataComponent(props: P) {
    const { user } = useAuth();
    const { triggerGlobalRefresh } = useDashboard();
    const [dashboardData, setDashboardData] = useState<DashboardData>({
      totalTeamMembers: 0,
      activeTeamMembers: 0,
      onLeaveToday: 0,
      presentToday: 0,
      pendingApprovals: 0,
      approvedThisMonth: 0,
      rejectedThisMonth: 0,
      totalRequests: 0,
      teamCapacity: 0,
      attendanceRate: 0,
      utilizationRate: 0,
      upcomingLeaves: [],
      recentRequests: [],
      isLoading: true,
      error: null,
      lastUpdated: null
    });
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchDashboardData = useCallback(async (forceRefresh = false) => {
      if (!user) {
        console.log('❌ withDashboardData: No user found, skipping fetch');
        return;
      }

      const now = Date.now();
      const cacheKey = `${user.role}-${user.id}`;
      
      // Check cache validity
      if (!forceRefresh && 
          dashboardDataCache.data && 
          dashboardDataCache.userRole === user.role &&
          (now - dashboardDataCache.timestamp) < cacheTimeout) {
        console.log('✅ withDashboardData: Using cached data');
        setDashboardData(dashboardDataCache.data);
        return;
      }

      try {
        setIsRefreshing(true);
        setDashboardData(prev => ({ ...prev, isLoading: true, error: null }));
        
        console.log('🔍 withDashboardData: Fetching dashboard data for user:', user.role, 'forceRefresh:', forceRefresh);
        console.log('🔍 withDashboardData: User details:', { id: user.id, name: user.name, role: user.role });
        
        // Check if we have a valid token
        const token = localStorage.getItem('token');
        console.log('🔍 withDashboardData: Auth token exists:', !!token);
        
        // Fetch data based on user role
        let teamResponse, leavesResponse, capacityResponse, holidaysResponse, pendingRequestsResponse;
        
        switch (user.role) {
          case 'manager':
            [teamResponse, leavesResponse, capacityResponse, holidaysResponse, pendingRequestsResponse] = await Promise.all([
              managerAPI.getTeamMembers({ limit: 100 }),
              managerAPI.getLeaveRequests({ limit: 100 }),
              managerAPI.getDashboardStats().catch(() => ({ success: false, data: null })), // Use same API as sidebar
              managerAPI.getUpcomingLeaves(10).catch(() => ({ success: false, data: [] })),
              managerAPI.getLeaveRequests({ status: 'pending', limit: 50 }).catch(() => ({ success: false, data: [] }))
            ]);
            break;
            
          case 'admin':
            [teamResponse, leavesResponse, capacityResponse, holidaysResponse, pendingRequestsResponse] = await Promise.all([
              adminAPI.getEmployees({ limit: 100 }),
              adminAPI.getLeaveRequests({ limit: 100 }),
              adminAPI.getDashboardStats().catch(() => ({ success: false, data: null })),
              Promise.resolve({ success: false, data: [] }), // No holidays API for admin
              Promise.resolve({ success: false, data: [] }) // No pending requests API for admin
            ]);
            break;
            
          case 'employee':
            [teamResponse, leavesResponse, capacityResponse, holidaysResponse, pendingRequestsResponse] = await Promise.all([
              employeeAPI.getDashboardStats().catch(() => ({ success: false, data: null })),
              employeeAPI.getLeaveRequests({ limit: 100 }).catch(() => ({ success: false, data: [] })),
              Promise.resolve({ success: false, data: null }), // No capacity data for employees
              Promise.resolve({ success: false, data: [] }), // No holidays API for employee
              Promise.resolve({ success: false, data: [] }) // No pending requests API for employee
            ]);
            break;
            
          default:
            throw new Error('Invalid user role');
        }

        console.log('📊 withDashboardData: API responses received');
        console.log('👥 Team response:', teamResponse);
        console.log('📅 Leaves response:', leavesResponse);
        console.log('📈 Capacity response:', capacityResponse);
        console.log('🎉 Holidays response:', holidaysResponse);
        console.log('⏳ Pending requests response:', pendingRequestsResponse);
        
        // Debug the actual data being processed
        if (user.role === 'manager' && pendingRequestsResponse?.success && pendingRequestsResponse?.data) {
          console.log('🔍 Manager pending requests raw data:', pendingRequestsResponse.data);
          if (Array.isArray(pendingRequestsResponse.data)) {
            pendingRequestsResponse.data.forEach((req: any, index: number) => {
              console.log(`🔍 Pending request ${index}:`, {
                id: req.id,
                user: req.user,
                department: req.user?.department,
                employeeName: req.user?.name
              });
            });
          }
        }
        
        // Debug admin data specifically
        if (user.role === 'admin') {
          console.log('🔍 Admin Dashboard Debug:');
          console.log('  - Team response success:', teamResponse?.success);
          console.log('  - Team response data:', teamResponse?.data);
          console.log('  - Leaves response success:', leavesResponse?.success);
          console.log('  - Leaves response data:', leavesResponse?.data);
        }
        

        // Process team members data
        let totalTeamMembers = 0;
        let activeTeamMembers = 0;
        let onLeaveToday = 0;
        let presentToday = 0;

        if (teamResponse.success && teamResponse.data) {
          const members = Array.isArray(teamResponse.data) ? teamResponse.data : teamResponse.data.data || [];
          totalTeamMembers = members.length;
          
          // Get current date for leave checking
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Process current leave requests to find who is on leave today
          const currentLeaves: Record<string, boolean> = {};
          if (leavesResponse.success && leavesResponse.data) {
            const leaves = Array.isArray(leavesResponse.data) ? leavesResponse.data : leavesResponse.data.data || [];
            leaves.forEach((leave: Record<string, unknown>) => {
              const startDate = new Date(String(leave.startDate || leave.start_date || ''));
              const endDate = new Date(String(leave.endDate || leave.end_date || ''));
              const userId = String(leave.userId || leave.employeeId || leave.employee_id || '');
              
              // Check if today falls within the leave period
              if (startDate <= today && today <= endDate && leave.status === 'approved') {
                currentLeaves[userId] = true;
              }
            });
          }
          
          // Calculate accurate counts
          members.forEach((member: Record<string, unknown>) => {
            const memberId = String(member.id || '');
            const isActive = Boolean(member.isActive);
            const isOnLeaveToday = currentLeaves[memberId] || false;
            
            if (isActive) {
              activeTeamMembers++;
              if (isOnLeaveToday) {
                onLeaveToday++;
              } else {
                presentToday++;
              }
            }
          });
        }

        // Process leave requests data
        let pendingApprovals = 0;
        let approvedThisMonth = 0;
        let rejectedThisMonth = 0;
        let totalRequests = 0;
        const upcomingLeaves: Array<{
          id: string;
          memberName: string;
          leaveType: string;
          startDate: string;
          endDate: string;
          days: number;
          status: string;
        }> = [];

        // For managers, use dashboard stats data if available (same as sidebar)
        if (user.role === 'manager' && capacityResponse.success && capacityResponse.data) {
          const dashboardStats = capacityResponse.data;
          pendingApprovals = dashboardStats.pendingApprovals || 0;
          approvedThisMonth = dashboardStats.approvedThisMonth || 0;
          rejectedThisMonth = dashboardStats.rejectedThisMonth || 0;
          totalRequests = dashboardStats.totalRequests || 0;
          console.log('🔍 Manager Dashboard Stats from API:', dashboardStats);
        }

        if (leavesResponse.success && leavesResponse.data) {
          const leaves = Array.isArray(leavesResponse.data) ? leavesResponse.data : leavesResponse.data.data || [];
          totalRequests = leaves.length;
          console.log('🔍 Raw leaves response data:', leaves);
          
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          leaves.forEach((leave: Record<string, unknown>) => {
            const status = String(leave.status || '');
            const leaveUser = leave.user as Record<string, unknown> | undefined;
            const employee = leave.employee as Record<string, unknown> | undefined;
            const leaveDate = new Date(String(leave.startDate || leave.start_date || ''));
            
            // Count by status (only if not using dashboard stats)
            if (user?.role !== 'manager' || !capacityResponse.success) {
              if (status === 'pending') {
                pendingApprovals++;
              } else if (status === 'approved') {
                approvedThisMonth++;
              } else if (status === 'rejected') {
                rejectedThisMonth++;
              }
            }
            
            // Add to upcoming leaves if it's in the future
            if (leaveDate > new Date()) {
              upcomingLeaves.push({
                id: String(leave.id || ''),
                memberName: String(leaveUser?.name || leave.employeeName || employee?.name || 'Unknown'),
                leaveType: String(leave.leaveType || leave.type || ''),
                startDate: String(leave.startDate || leave.start_date || ''),
                endDate: String(leave.endDate || leave.end_date || ''),
                days: Number(leave.days || leave.totalDays || 1),
                status: status
              });
            }
          });
        }

        // Calculate capacity metrics
        const attendanceRate = totalTeamMembers > 0 ? Math.round((presentToday / totalTeamMembers) * 100) : 0;
        const teamCapacity = totalTeamMembers > 0 ? Math.round((activeTeamMembers / totalTeamMembers) * 100) : 0;
        const utilizationRate = attendanceRate; // Same as attendance rate for now

        // Process recent requests for display
        // For managers, use pending requests if available, otherwise use general recent requests
        const requestsToProcess = user.role === 'manager' && pendingRequestsResponse?.success && pendingRequestsResponse?.data ? 
          pendingRequestsResponse.data : 
          (leavesResponse.success && leavesResponse.data ? leavesResponse.data : null);
          
        console.log('🔍 Data source selection for recent requests:');
        console.log('  - User role:', user.role);
        console.log('  - Pending requests response success:', pendingRequestsResponse?.success);
        console.log('  - Pending requests response data:', pendingRequestsResponse?.data);
        console.log('  - Leaves response success:', leavesResponse?.success);
        console.log('  - Leaves response data:', leavesResponse?.data);
        console.log('  - Selected data source:', user.role === 'manager' && pendingRequestsResponse?.success && pendingRequestsResponse?.data ? 'pending-requests' : 'recent-requests');
        console.log('  - Requests to process:', requestsToProcess);
          
          
        const recentRequests = requestsToProcess ? 
          (Array.isArray(requestsToProcess) ? requestsToProcess : requestsToProcess.data || [])
            .map((leave: Record<string, unknown>) => {
              const employeeName = String((leave.user as Record<string, unknown>)?.name || leave.employeeName || (leave.employee as Record<string, unknown>)?.name || 'Unknown');
              // Check multiple possible locations for department data
              const department = String(
                (leave.user as Record<string, unknown>)?.department || 
                (leave.employee as Record<string, unknown>)?.department || 
                leave.department || 
                'Unassigned'
              );
              
              console.log('🔍 Processing leave request for department:', {
                id: leave.id,
                employeeName,
                user: leave.user,
                employee: leave.employee,
                directDepartment: leave.department,
                userDepartment: (leave.user as Record<string, unknown>)?.department,
                employeeDepartment: (leave.employee as Record<string, unknown>)?.department,
                finalDepartment: department,
                rawLeave: leave
              });
              
              return {
                id: String(leave.id || ''),
                employeeName: employeeName,
                leaveType: String(leave.leaveType || leave.type || ''),
                status: String(leave.status || ''),
                days: Number(leave.days || leave.totalDays || 1),
                startDate: String(leave.startDate || leave.start_date || ''),
                endDate: String(leave.endDate || leave.end_date || ''),
                submittedAt: String(leave.submittedAt || leave.created_at || ''),
                priority: String(leave.priority || 'medium'),
                department: department
              };
            }) : [];

        const processedData: DashboardData = {
          totalTeamMembers,
          activeTeamMembers,
          onLeaveToday,
          presentToday,
          pendingApprovals,
          approvedThisMonth,
          rejectedThisMonth,
          totalRequests,
          teamCapacity,
          attendanceRate,
          utilizationRate,
          upcomingLeaves: upcomingLeaves.slice(0, 5), // Limit to 5 upcoming leaves
          recentRequests: recentRequests.slice(0, 10), // Include recent requests
          isLoading: false,
          error: null,
          lastUpdated: new Date()
        };

        // Update cache
        dashboardDataCache = {
          data: processedData,
          timestamp: now,
          userRole: user.role
        };

        setDashboardData(processedData);
        console.log('✅ withDashboardData: Dashboard data processed and cached:', processedData);
        
        // Debug the specific counts for manager
        if (user.role === 'manager') {
          console.log('🔍 Manager Dashboard Processed Data:');
          console.log('  - pendingApprovals:', processedData.pendingApprovals);
          console.log('  - approvedThisMonth:', processedData.approvedThisMonth);
          console.log('  - rejectedThisMonth:', processedData.rejectedThisMonth);
          console.log('  - recentRequests count:', processedData.recentRequests?.length || 0);
          console.log('  - recentRequests:', processedData.recentRequests);
        }

      } catch (error) {
        console.error('❌ withDashboardData: Error fetching dashboard data:', error);
        console.error('❌ withDashboardData: Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          user: user?.role
        });
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
        setDashboardData(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }));
      } finally {
        setIsRefreshing(false);
      }
    }, [user, cacheTimeout]);

    const refreshDashboardData = useCallback(async () => {
      await fetchDashboardData(true);
    }, [fetchDashboardData]);

    // Auto-fetch on mount and when user changes
    useEffect(() => {
      console.log('🔍 withDashboardData: useEffect triggered, user:', user, 'autoFetch:', autoFetch);
      if (user) {
        console.log('🔄 withDashboardData: Initial data fetch triggered, autoFetch:', autoFetch);
        fetchDashboardData();
      } else {
        console.log('❌ withDashboardData: No user found, skipping initial fetch');
      }
    }, [user, fetchDashboardData]);

    // Set up auto-refresh interval
    useEffect(() => {
      if (!autoFetch || !user) return;

      const interval = setInterval(() => {
        console.log('🔄 withDashboardData: Auto-refreshing dashboard data...');
        fetchDashboardData();
      }, refreshInterval);

      return () => clearInterval(interval);
    }, [autoFetch, user, fetchDashboardData, refreshInterval]);

    // Listen for global refresh triggers
    useEffect(() => {
      const handleGlobalRefresh = () => {
        console.log('🔄 withDashboardData: Received global refresh signal');
        fetchDashboardData(true);
      };

      // Listen for storage events (cross-tab communication)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'global-refresh' && e.newValue) {
          try {
            const refreshData = JSON.parse(e.newValue);
            if (refreshData.type === 'leave' || refreshData.type === 'all') {
              handleGlobalRefresh();
            }
          } catch (err) {
            console.error('Error parsing global refresh data:', err);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }, [fetchDashboardData]);

    const hocProps: WithDashboardDataProps = {
      dashboardData,
      refreshDashboardData,
      isRefreshing
    };

    return <WrappedComponent {...props} {...hocProps} />;
  };
}

// Pre-configured components for different user roles
export const ManagerDashboardData = withDashboardData(
  ({ dashboardData, refreshDashboardData, isRefreshing, ...props }: WithDashboardDataProps & Record<string, unknown>) => {
    return (
      <div {...props}>
        {/* This will be used by Manager Dashboard components */}
        {props.children as React.ReactNode}
      </div>
    );
  },
  { autoFetch: true, refreshInterval: 30000 }
);

export const AdminDashboardData = withDashboardData(
  ({ dashboardData, refreshDashboardData, isRefreshing, ...props }: WithDashboardDataProps & Record<string, unknown>) => {
    return (
      <div {...props}>
        {/* This will be used by Admin Dashboard components */}
        {props.children as React.ReactNode}
      </div>
    );
  },
  { autoFetch: true, refreshInterval: 30000 }
);

export const EmployeeDashboardData = withDashboardData(
  ({ dashboardData, refreshDashboardData, isRefreshing, ...props }: WithDashboardDataProps & Record<string, unknown>) => {
    return (
      <div {...props}>
        {/* This will be used by Employee Dashboard components */}
        {props.children as React.ReactNode}
      </div>
    );
  },
  { autoFetch: true, refreshInterval: 30000 }
);
