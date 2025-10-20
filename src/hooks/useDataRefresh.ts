import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { triggerGlobalDataRefresh } from '@/contexts/DashboardContext';

/**
 * Custom hook for handling data refresh after mutations
 * Automatically triggers appropriate cache invalidation and data refresh
 */
export const useDataRefresh = () => {
  const { user } = useAuth();
  const { 
    refreshDashboard, 
    refreshLeaveRequests, 
    refreshStats, 
    refreshLeaveBalances,
    refreshTeamMembers,
    refreshEmployees,
    invalidateCache,
    triggerGlobalRefresh
  } = useDashboard();

  const refreshAfterLeaveAction = useCallback(async (action: 'create' | 'approve' | 'reject' | 'update') => {
    console.log('🔄 useDataRefresh: Refreshing after leave action:', action);
    
    // Refresh dashboard data
    await refreshDashboard();
    
    // Refresh leave requests
    await refreshLeaveRequests();
    
    // Refresh stats
    await refreshStats();
    
    // Refresh leave balances
    await refreshLeaveBalances();
    
    // Trigger global refresh for leave-related data
    triggerGlobalRefresh('leave');
    
    console.log('✅ useDataRefresh: Leave action refresh completed');
  }, [refreshDashboard, refreshLeaveRequests, refreshStats, refreshLeaveBalances, triggerGlobalRefresh]);

  const refreshAfterEmployeeAction = useCallback(async (action: 'create' | 'update' | 'delete' | 'status-change') => {
    console.log('🔄 useDataRefresh: Refreshing after employee action:', action);
    
    // Refresh dashboard data
    await refreshDashboard();
    
    // Refresh employees
    await refreshEmployees();
    
    // Refresh leave balances (since employee changes might affect leave data)
    await refreshLeaveBalances();
    
    // Trigger global refresh for employee-related data
    triggerGlobalRefresh('employee');
    
    console.log('✅ useDataRefresh: Employee action refresh completed');
  }, [refreshDashboard, refreshEmployees, refreshLeaveBalances, triggerGlobalRefresh]);

  const refreshAfterTeamAction = useCallback(async (action: 'add' | 'remove' | 'update') => {
    console.log('🔄 useDataRefresh: Refreshing after team action:', action);
    
    // Refresh dashboard data
    await refreshDashboard();
    
    // Refresh team members
    await refreshTeamMembers();
    
    // Refresh leave balances
    await refreshLeaveBalances();
    
    // Trigger global refresh for team-related data
    triggerGlobalRefresh('team');
    
    console.log('✅ useDataRefresh: Team action refresh completed');
  }, [refreshDashboard, refreshTeamMembers, refreshLeaveBalances, triggerGlobalRefresh]);

  const refreshAfterPolicyAction = useCallback(async (action: 'create' | 'update' | 'delete') => {
    console.log('🔄 useDataRefresh: Refreshing after policy action:', action);
    
    // Refresh dashboard data
    await refreshDashboard();
    
    // Refresh stats
    await refreshStats();
    
    // Refresh leave balances (policies affect leave calculations)
    await refreshLeaveBalances();
    
    // Trigger global refresh for all data
    triggerGlobalRefresh('all');
    
    console.log('✅ useDataRefresh: Policy action refresh completed');
  }, [refreshDashboard, refreshStats, refreshLeaveBalances, triggerGlobalRefresh]);

  const refreshSpecificData = useCallback(async (dataType: 'dashboard' | 'leaveRequests' | 'stats' | 'leaveBalances' | 'teamMembers' | 'employees') => {
    console.log('🔄 useDataRefresh: Refreshing specific data type:', dataType);
    
    switch (dataType) {
      case 'dashboard':
        await refreshDashboard();
        break;
      case 'leaveRequests':
        await refreshLeaveRequests();
        break;
      case 'stats':
        await refreshStats();
        break;
      case 'leaveBalances':
        await refreshLeaveBalances();
        break;
      case 'teamMembers':
        await refreshTeamMembers();
        break;
      case 'employees':
        await refreshEmployees();
        break;
    }
    
    console.log('✅ useDataRefresh: Specific data refresh completed for:', dataType);
  }, [refreshDashboard, refreshLeaveRequests, refreshStats, refreshLeaveBalances, refreshTeamMembers, refreshEmployees]);

  const invalidateSpecificCache = useCallback((pattern: string) => {
    console.log('🗑️ useDataRefresh: Invalidating cache for pattern:', pattern);
    invalidateCache(pattern);
  }, [invalidateCache]);

  const triggerCrossTabRefresh = useCallback((type: 'leave' | 'employee' | 'team' | 'all') => {
    console.log('🔄 useDataRefresh: Triggering cross-tab refresh for type:', type);
    triggerGlobalDataRefresh(type);
  }, []);

  return {
    refreshAfterLeaveAction,
    refreshAfterEmployeeAction,
    refreshAfterTeamAction,
    refreshAfterPolicyAction,
    refreshSpecificData,
    invalidateSpecificCache,
    triggerCrossTabRefresh,
    // Direct access to context methods
    refreshDashboard,
    refreshLeaveRequests,
    refreshStats,
    refreshLeaveBalances,
    refreshTeamMembers,
    refreshEmployees,
    invalidateCache,
    triggerGlobalRefresh
  };
};

export default useDataRefresh;
