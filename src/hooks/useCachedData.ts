import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getCachedLeaveBalance, 
  setCachedLeaveBalance,
  getCachedLeaveRequests,
  setCachedLeaveRequests,
  getCachedTeamMembers,
  setCachedTeamMembers,
  getCachedEmployees,
  setCachedEmployees
} from '@/contexts/DashboardContext';

/**
 * Custom hook for managing cached data with automatic refresh capabilities
 */
export const useCachedData = () => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Force refresh by incrementing trigger
  const forceRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    refreshTrigger,
    forceRefresh,
    user
  };
};

/**
 * Hook for cached leave balance data
 */
export const useCachedLeaveBalance = (userId: string) => {
  const { user, refreshTrigger } = useCachedData();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user || !userId) return;

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedData = getCachedLeaveBalance(userId, user.role);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // Fetch from API if not cached
      const { managerAPI, adminAPI, employeeAPI } = await import('@/lib/api');
      let response;

      switch (user.role) {
        case 'admin':
          response = await adminAPI.getUserLeaveBalance(userId);
          break;
        case 'manager':
          response = await managerAPI.getTeamMemberLeaveBalance(userId);
          break;
        case 'employee':
          // For employee, we might need to get their own balance
          response = await employeeAPI.getDashboardStats();
          break;
        default:
          throw new Error('Invalid user role');
      }

      if (response.success && response.data) {
        setData(response.data);
        setCachedLeaveBalance(userId, user.role, response.data);
      } else {
        setError('Failed to fetch leave balance');
      }
    } catch (err) {
      console.error('Error fetching leave balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leave balance');
    } finally {
      setLoading(false);
    }
  }, [user, userId, refreshTrigger]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

/**
 * Hook for cached leave requests data
 */
export const useCachedLeaveRequests = (params?: any) => {
  const { user, refreshTrigger } = useCachedData();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedData = getCachedLeaveRequests(user.role, params);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // Fetch from API if not cached
      const { managerAPI, adminAPI, employeeAPI } = await import('@/lib/api');
      let response;

      switch (user.role) {
        case 'admin':
          response = await adminAPI.getLeaveRequests(params);
          break;
        case 'manager':
          response = await managerAPI.getLeaveApprovals(params);
          break;
        case 'employee':
          response = await employeeAPI.getRecentRequests(params?.limit || 10);
          break;
        default:
          throw new Error('Invalid user role');
      }

      if (response.success && response.data) {
        const responseData = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setData(responseData);
        setCachedLeaveRequests(user.role, params, responseData);
      } else {
        setError('Failed to fetch leave requests');
      }
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  }, [user, params, refreshTrigger]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

/**
 * Hook for cached team members data
 */
export const useCachedTeamMembers = (params?: any) => {
  const { user, refreshTrigger } = useCachedData();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedData = getCachedTeamMembers(user.role, params);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // Fetch from API if not cached
      const { managerAPI } = await import('@/lib/api');
      const response = await managerAPI.getTeamMembers(params);

      if (response.success && response.data) {
        const responseData = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setData(responseData);
        setCachedTeamMembers(user.role, params, responseData);
      } else {
        setError('Failed to fetch team members');
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  }, [user, params, refreshTrigger]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

/**
 * Hook for cached employees data
 */
export const useCachedEmployees = (params?: any) => {
  const { user, refreshTrigger } = useCachedData();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedData = getCachedEmployees(user.role, params);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // Fetch from API if not cached
      const { adminAPI } = await import('@/lib/api');
      const response = await adminAPI.getEmployees(params);

      if (response.success && response.data) {
        const responseData = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setData(responseData);
        setCachedEmployees(user.role, params, responseData);
      } else {
        setError('Failed to fetch employees');
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  }, [user, params, refreshTrigger]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

export default useCachedData;
