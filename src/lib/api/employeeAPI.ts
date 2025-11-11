// Employee API endpoints
import { apiRequest } from './base';
import {
  ApiResponse,
  DashboardStatsParams,
  EmployeeDashboardStats,
  PersonalInfo,
  LeaveBalanceParams,
  UpcomingHoliday,
  TeamInfo,
  PerformanceMetrics,
  Notification,
  LeaveHistoryParams,
  LeaveHistorySummary,
  CreateLeaveRequest,
  UpdateLeaveRequest,
  LeavePolicyParams,
  UpdateProfileRequest,
  UpdateAvatarRequest,
  UpdatePasswordRequest,
  NotificationPreferences,
  UpdateNotificationPreferencesRequest,
  AppPreferences,
  UpdateAppPreferencesRequest,
  PrivacySettings,
  UpdatePrivacySettingsRequest,
  SecuritySettings,
  UpdateSecuritySettingsRequest,
  PerformanceGoal,
  Achievement,
  QuickStats,
  PaginatedResponse,
} from '../../types/api';
import { LeaveRequest, LeaveBalance, LeavePolicy } from '../../types/leave';

export const employeeAPI = {
  // Dashboard
  getDashboardStats: (params?: DashboardStatsParams): Promise<ApiResponse<EmployeeDashboardStats>> => 
    apiRequest(`/employee/dashboard/stats${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  
  getPersonalInfo: (): Promise<ApiResponse<PersonalInfo>> => apiRequest('/employee/dashboard/personal-info'),
  
  getLeaveBalance: (params?: LeaveBalanceParams): Promise<ApiResponse<LeaveBalance>> => 
    apiRequest(`/employee/dashboard/leave-balance${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  
  getRecentRequests: (limit?: number, params?: Record<string, string>): Promise<ApiResponse<LeaveRequest[]>> => 
    apiRequest(`/employee/dashboard/recent-requests${limit ? `?limit=${limit}` : ''}${params ? (limit ? '&' : '?') + new URLSearchParams(params).toString() : ''}`),
  
  getUpcomingHolidays: (limit?: number): Promise<ApiResponse<UpcomingHoliday[]>> => 
    apiRequest(`/employee/holidays/upcoming${limit ? `?limit=${limit}` : ''}`),
  
  getTeamInfo: (): Promise<ApiResponse<TeamInfo>> => apiRequest('/employee/dashboard/team-info'),
  
  getPerformanceMetrics: (): Promise<ApiResponse<PerformanceMetrics>> => apiRequest('/employee/dashboard/performance'),
  
  getNotifications: (limit?: number): Promise<ApiResponse<Notification[]>> => 
    apiRequest(`/employee/dashboard/notifications${limit ? `?limit=${limit}` : ''}`),
  
  getQuickStats: (params?: DashboardStatsParams): Promise<ApiResponse<QuickStats>> => 
    apiRequest(`/employee/dashboard/quick-stats${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  
  // Leave Requests
  createLeaveRequest: (leaveData: CreateLeaveRequest): Promise<ApiResponse<LeaveRequest>> =>
    apiRequest('/employee/leave-requests', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    }),
  
  getLeaveRequests: (params?: LeaveHistoryParams): Promise<ApiResponse<PaginatedResponse<LeaveRequest>>> => {
    if (!params) {
      return apiRequest(`/employee/leave-requests`);
    }
    // Filter out undefined/null/empty values
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = String(value);
      }
    });
    const queryString = Object.keys(cleanParams).length > 0 
      ? '?' + new URLSearchParams(cleanParams).toString() 
      : '';
    return apiRequest(`/employee/leave-requests${queryString}`);
  },
  
  getLeaveRequestById: (id: string): Promise<ApiResponse<LeaveRequest>> => apiRequest(`/employee/leave-requests/${id}`),
  
  updateLeaveRequest: (id: string, leaveData: UpdateLeaveRequest): Promise<ApiResponse<LeaveRequest>> =>
    apiRequest(`/employee/leave-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leaveData),
    }),
  
  cancelLeaveRequest: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/employee/leave-requests/${id}`, {
      method: 'DELETE',
    }),
  
  // Leave History
  getLeaveHistory: (params?: LeaveHistoryParams): Promise<ApiResponse<PaginatedResponse<LeaveRequest>>> => 
    apiRequest(`/employee/leave-history${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  
  getLeaveHistorySummary: (params?: LeaveHistoryParams): Promise<ApiResponse<LeaveHistorySummary>> => 
    apiRequest(`/employee/leave-history/summary${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  
  // Profile Management
  getProfile: (): Promise<ApiResponse<Record<string, unknown>>> => apiRequest('/employee/profile'),
  
  updateProfile: (profileData: UpdateProfileRequest): Promise<ApiResponse<Record<string, unknown>>> =>
    apiRequest('/employee/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
  
  updateAvatar: (avatarUrl: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest('/employee/profile/avatar', {
      method: 'PUT',
      body: JSON.stringify({ avatar: avatarUrl }),
    }),
  
  updatePassword: (passwordData: UpdatePasswordRequest): Promise<ApiResponse<{ message: string }>> =>
    apiRequest('/employee/profile/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    }),
  
  // Settings
  getNotificationPreferences: (): Promise<ApiResponse<NotificationPreferences>> => apiRequest('/employee/settings/notifications'),
  
  updateNotificationPreferences: (preferences: UpdateNotificationPreferencesRequest): Promise<ApiResponse<NotificationPreferences>> =>
    apiRequest('/employee/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),
  
  getPrivacySettings: (): Promise<ApiResponse<PrivacySettings>> => apiRequest('/employee/settings/privacy'),
  
  updatePrivacySettings: (settings: UpdatePrivacySettingsRequest): Promise<ApiResponse<PrivacySettings>> =>
    apiRequest('/employee/settings/privacy', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  
  getSecuritySettings: (): Promise<ApiResponse<SecuritySettings>> => apiRequest('/employee/settings/security'),
  
  updateSecuritySettings: (settings: UpdateSecuritySettingsRequest): Promise<ApiResponse<{ updated: boolean }>> =>
    apiRequest('/employee/settings/security', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  
  // App Preferences
  getAppPreferences: (): Promise<ApiResponse<AppPreferences>> => apiRequest('/employee/settings/app-preferences'),
  
  updateAppPreferences: (preferences: UpdateAppPreferencesRequest): Promise<ApiResponse<{ updated: boolean }>> =>
    apiRequest('/employee/settings/app-preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),
  
  // Data Management
  exportUserData: (): Promise<ApiResponse<Record<string, unknown>>> => apiRequest('/employee/data/export'),
  
  deleteUserAccount: (): Promise<ApiResponse<{ deleted: boolean }>> =>
    apiRequest('/employee/account', {
      method: 'DELETE',
    }),
  
  // Performance
  getPerformanceGoals: (): Promise<ApiResponse<PerformanceGoal[]>> => apiRequest('/employee/performance/goals'),
  
  getAchievements: (): Promise<ApiResponse<Achievement[]>> => apiRequest('/employee/performance/achievements'),
  
  // Leave Policies (Read-only access for employees)
  getLeavePolicies: (params?: LeavePolicyParams): Promise<ApiResponse<PaginatedResponse<LeavePolicy>>> => 
    apiRequest(`/employee/policies${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  
  getLeavePolicyById: (id: string): Promise<ApiResponse<LeavePolicy>> => apiRequest(`/employee/policies/${id}`),
  
  getLeavePolicyStats: (): Promise<ApiResponse<{ totalPolicies: number; activePolicies: number; inactivePolicies: number; byLeaveType: Record<string, number> }>> => 
    apiRequest('/employee/policies/stats'),
  
  getLeavePolicyTypes: (): Promise<ApiResponse<string[]>> => apiRequest('/employee/policies/types'),
};

