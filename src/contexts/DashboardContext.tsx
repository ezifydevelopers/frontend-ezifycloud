import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth, AuthContext } from './AuthContext';
import { adminAPI, managerAPI, employeeAPI } from '@/lib/api';
import { APP_CONFIG } from '@/lib/config';

interface DashboardData {
  stats?: any;
  leaveRequests?: any[];
  teamMembers?: any[];
  performanceData?: any;
  lastUpdated?: number;
}

interface DataRefreshContextType {
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  refreshDashboard: () => Promise<void>;
  refreshLeaveRequests: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshLeaveBalances: () => Promise<void>;
  refreshTeamMembers: () => Promise<void>;
  refreshEmployees: () => Promise<void>;
  invalidateCache: (key: string) => void;
  triggerGlobalRefresh: (type: 'leave' | 'employee' | 'team' | 'all') => void;
}

// Global cache for different data types
interface GlobalCache {
  leaveRequests: Map<string, { data: any; timestamp: number }>;
  leaveBalances: Map<string, { data: any; timestamp: number }>;
  teamMembers: Map<string, { data: any; timestamp: number }>;
  employees: Map<string, { data: any; timestamp: number }>;
  stats: Map<string, { data: any; timestamp: number }>;
}

const globalCache: GlobalCache = {
  leaveRequests: new Map(),
  leaveBalances: new Map(),
  teamMembers: new Map(),
  employees: new Map(),
  stats: new Map()
};

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

const DashboardContext = createContext<DataRefreshContextType | undefined>(undefined);

// Cache utility functions
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_TTL;
};

const getCacheKey = (userRole: string, endpoint: string, params?: any): string => {
  return `${userRole}:${endpoint}:${JSON.stringify(params || {})}`;
};

const getCachedData = (cache: Map<string, { data: any; timestamp: number }>, key: string): any | null => {
  const cached = cache.get(key);
  if (cached && isCacheValid(cached.timestamp)) {
    console.log('📦 Using cached data for:', key);
    return cached.data;
  }
  return null;
};

const setCachedData = (cache: Map<string, { data: any; timestamp: number }>, key: string, data: any): void => {
  cache.set(key, { data, timestamp: Date.now() });
  console.log('💾 Cached data for:', key);
};

const invalidateCacheByType = (type: keyof GlobalCache, pattern?: string): void => {
  const cache = globalCache[type];
  if (pattern) {
    // Invalidate specific entries matching pattern
    for (const [key] of cache) {
      if (key.includes(pattern)) {
        cache.delete(key);
        console.log('🗑️ Invalidated cache entry:', key);
      }
    }
  } else {
    // Invalidate all entries of this type
    cache.clear();
    console.log('🗑️ Invalidated all cache entries for type:', type);
  }
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user || !authContext) return;

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

  const refreshLeaveBalances = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🔄 DashboardContext: Refreshing leave balances...');
      
      // Invalidate leave balance cache
      invalidateCacheByType('leaveBalances');
      
      // Trigger refresh for all cached leave balance requests
      const cacheKey = getCacheKey(user.role, 'leave-balances');
      const cached = globalCache.leaveBalances.get(cacheKey);
      if (cached) {
        globalCache.leaveBalances.delete(cacheKey);
      }
      
      console.log('✅ DashboardContext: Leave balances cache invalidated');
    } catch (err) {
      console.error('❌ DashboardContext: Error refreshing leave balances:', err);
    }
  }, [user]);

  const refreshTeamMembers = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🔄 DashboardContext: Refreshing team members...');
      
      // Invalidate team members cache
      invalidateCacheByType('teamMembers');
      
      console.log('✅ DashboardContext: Team members cache invalidated');
    } catch (err) {
      console.error('❌ DashboardContext: Error refreshing team members:', err);
    }
  }, [user]);

  const refreshEmployees = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🔄 DashboardContext: Refreshing employees...');
      
      // Invalidate employees cache
      invalidateCacheByType('employees');
      
      console.log('✅ DashboardContext: Employees cache invalidated');
    } catch (err) {
      console.error('❌ DashboardContext: Error refreshing employees:', err);
    }
  }, [user]);

  const invalidateCache = useCallback((key: string) => {
    console.log('🗑️ Invalidating cache for key:', key);
    
    // Invalidate all cache types that might contain this key
    Object.keys(globalCache).forEach(cacheType => {
      const cache = globalCache[cacheType as keyof GlobalCache];
      for (const [cacheKey] of cache) {
        if (cacheKey.includes(key)) {
          cache.delete(cacheKey);
          console.log('🗑️ Deleted cache entry:', cacheKey);
        }
      }
    });
  }, []);

  const triggerGlobalRefresh = useCallback((type: 'leave' | 'employee' | 'team' | 'all') => {
    console.log('🔄 Triggering global refresh for type:', type);
    
    switch (type) {
      case 'leave':
        invalidateCacheByType('leaveRequests');
        invalidateCacheByType('leaveBalances');
        break;
      case 'employee':
        invalidateCacheByType('employees');
        invalidateCacheByType('leaveBalances');
        break;
      case 'team':
        invalidateCacheByType('teamMembers');
        invalidateCacheByType('leaveBalances');
        break;
      case 'all':
        Object.keys(globalCache).forEach(cacheType => {
          invalidateCacheByType(cacheType as keyof GlobalCache);
        });
        break;
    }
    
    // Trigger dashboard refresh
    fetchDashboardData();
    
    // Notify other tabs
    localStorage.setItem('global-refresh', JSON.stringify({ type, timestamp: Date.now() }));
  }, [fetchDashboardData]);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  // Auto-refresh disabled - data will only refresh manually or on page load
  // useEffect(() => {
  //   if (!user) return;

  //   const interval = setInterval(() => {
  //     console.log('🔄 DashboardContext: Auto-refreshing dashboard data...');
  //     fetchDashboardData();
  //   }, APP_CONFIG.UI.AUTO_REFRESH.NOTIFICATIONS);

  //   return () => clearInterval(interval);
  // }, [user, fetchDashboardData]);

  // Listen for storage events (cross-tab communication)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dashboard-refresh' && e.newValue) {
        console.log('🔄 DashboardContext: Received dashboard refresh signal from another tab');
        fetchDashboardData();
        localStorage.removeItem('dashboard-refresh');
      }
      
      if (e.key === 'global-refresh' && e.newValue) {
        try {
          const refreshData = JSON.parse(e.newValue);
          console.log('🔄 DashboardContext: Received global refresh signal from another tab:', refreshData);
          triggerGlobalRefresh(refreshData.type);
          localStorage.removeItem('global-refresh');
        } catch (err) {
          console.error('Error parsing global refresh data:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchDashboardData, triggerGlobalRefresh]);

  // Refresh data when user focuses on the window (returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 DashboardContext: Window focused, refreshing dashboard data...');
      fetchDashboardData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchDashboardData]);

  const value: DataRefreshContextType = {
    dashboardData,
    loading,
    error,
    refreshDashboard,
    refreshLeaveRequests,
    refreshStats,
    refreshLeaveBalances,
    refreshTeamMembers,
    refreshEmployees,
    invalidateCache,
    triggerGlobalRefresh
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

// Global cache utilities for use in components
export const getCachedLeaveBalance = (userId: string, userRole: string): any | null => {
  const cacheKey = getCacheKey(userRole, 'leave-balance', { userId });
  return getCachedData(globalCache.leaveBalances, cacheKey);
};

export const setCachedLeaveBalance = (userId: string, userRole: string, data: any): void => {
  const cacheKey = getCacheKey(userRole, 'leave-balance', { userId });
  setCachedData(globalCache.leaveBalances, cacheKey, data);
};

export const getCachedLeaveRequests = (userRole: string, params?: any): any | null => {
  const cacheKey = getCacheKey(userRole, 'leave-requests', params);
  return getCachedData(globalCache.leaveRequests, cacheKey);
};

export const setCachedLeaveRequests = (userRole: string, params: any, data: any): void => {
  const cacheKey = getCacheKey(userRole, 'leave-requests', params);
  setCachedData(globalCache.leaveRequests, cacheKey, data);
};

export const getCachedTeamMembers = (userRole: string, params?: any): any | null => {
  const cacheKey = getCacheKey(userRole, 'team-members', params);
  return getCachedData(globalCache.teamMembers, cacheKey);
};

export const setCachedTeamMembers = (userRole: string, params: any, data: any): void => {
  const cacheKey = getCacheKey(userRole, 'team-members', params);
  setCachedData(globalCache.teamMembers, cacheKey, data);
};

export const getCachedEmployees = (userRole: string, params?: any): any | null => {
  const cacheKey = getCacheKey(userRole, 'employees', params);
  return getCachedData(globalCache.employees, cacheKey);
};

export const setCachedEmployees = (userRole: string, params: any, data: any): void => {
  const cacheKey = getCacheKey(userRole, 'employees', params);
  setCachedData(globalCache.employees, cacheKey, data);
};

// Global refresh trigger function
export const triggerGlobalDataRefresh = (type: 'leave' | 'employee' | 'team' | 'all') => {
  localStorage.setItem('global-refresh', JSON.stringify({ type, timestamp: Date.now() }));
};
