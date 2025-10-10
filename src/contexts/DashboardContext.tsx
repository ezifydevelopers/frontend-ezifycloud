import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { adminAPI, managerAPI, employeeAPI } from '@/lib/api';

interface DashboardData {
  stats?: any;
  leaveRequests?: any[];
  teamMembers?: any[];
  performanceData?: any;
  lastUpdated?: number;
}

interface DashboardContextType {
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  refreshDashboard: () => Promise<void>;
  refreshLeaveRequests: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 DashboardContext: Refreshing dashboard data for role:', user.role);
      
      let statsResponse;
      let leaveRequestsResponse;
      
      // Fetch data based on user role
      switch (user.role) {
        case 'admin':
          statsResponse = await adminAPI.getDashboardStats();
          leaveRequestsResponse = await adminAPI.getLeaveRequests({ limit: 10 });
          break;
        case 'manager':
          statsResponse = await managerAPI.getDashboardStats();
          leaveRequestsResponse = await managerAPI.getLeaveApprovals({ limit: 10 });
          break;
        case 'employee':
          statsResponse = await employeeAPI.getDashboardStats();
          leaveRequestsResponse = await employeeAPI.getRecentRequests(10);
          break;
        default:
          throw new Error('Invalid user role');
      }

      const newData: DashboardData = {
        stats: statsResponse.success ? statsResponse.data : null,
        leaveRequests: leaveRequestsResponse.success ? 
          (Array.isArray(leaveRequestsResponse.data) ? leaveRequestsResponse.data : leaveRequestsResponse.data?.data || []) : [],
        lastUpdated: Date.now()
      };

      console.log('🔍 DashboardContext: Stats response:', statsResponse);
      console.log('🔍 DashboardContext: Leave requests response:', leaveRequestsResponse);
      console.log('🔍 DashboardContext: New data:', newData);

      setDashboardData(newData);
      console.log('✅ DashboardContext: Data refreshed successfully');
      
    } catch (err) {
      console.error('❌ DashboardContext: Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshDashboard = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  const refreshLeaveRequests = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🔄 DashboardContext: Refreshing leave requests...');
      
      let leaveRequestsResponse;
      switch (user.role) {
        case 'admin':
          leaveRequestsResponse = await adminAPI.getLeaveRequests({ limit: 10 });
          break;
        case 'manager':
          leaveRequestsResponse = await managerAPI.getLeaveApprovals({ limit: 10 });
          break;
        case 'employee':
          leaveRequestsResponse = await employeeAPI.getRecentRequests(10);
          break;
        default:
          return;
      }

      if (leaveRequestsResponse.success) {
        const newLeaveRequests = Array.isArray(leaveRequestsResponse.data) ? 
          leaveRequestsResponse.data : 
          leaveRequestsResponse.data?.data || [];

        setDashboardData(prev => ({
          ...prev,
          leaveRequests: newLeaveRequests,
          lastUpdated: Date.now()
        }));
        
        console.log('✅ DashboardContext: Leave requests refreshed');
      }
    } catch (err) {
      console.error('❌ DashboardContext: Error refreshing leave requests:', err);
    }
  }, [user]);

  const refreshStats = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🔄 DashboardContext: Refreshing stats...');
      
      let statsResponse;
      switch (user.role) {
        case 'admin':
          statsResponse = await adminAPI.getDashboardStats();
          break;
        case 'manager':
          statsResponse = await managerAPI.getDashboardStats();
          break;
        case 'employee':
          statsResponse = await employeeAPI.getDashboardStats();
          break;
        default:
          return;
      }

      if (statsResponse.success) {
        setDashboardData(prev => ({
          ...prev,
          stats: statsResponse.data,
          lastUpdated: Date.now()
        }));
        
        console.log('✅ DashboardContext: Stats refreshed');
      }
    } catch (err) {
      console.error('❌ DashboardContext: Error refreshing stats:', err);
    }
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  // Set up auto-refresh every 2 minutes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      console.log('🔄 DashboardContext: Auto-refreshing dashboard data...');
      fetchDashboardData();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [user, fetchDashboardData]);

  // Listen for storage events (cross-tab communication)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dashboard-refresh' && e.newValue) {
        console.log('🔄 DashboardContext: Received refresh signal from another tab');
        fetchDashboardData();
        localStorage.removeItem('dashboard-refresh');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchDashboardData]);

  const value: DashboardContextType = {
    dashboardData,
    loading,
    error,
    refreshDashboard,
    refreshLeaveRequests,
    refreshStats
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

// Utility function to trigger dashboard refresh from anywhere in the app
export const triggerDashboardRefresh = () => {
  localStorage.setItem('dashboard-refresh', Date.now().toString());
};
