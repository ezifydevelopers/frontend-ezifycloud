// API utility functions for authenticated requests

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Make authenticated API request
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid, clear auth data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// API endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  register: (userData: any) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  
  forgotPassword: (email: string) =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  
  resetPassword: (token: string, password: string) =>
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

export const userAPI = {
  getProfile: () => apiRequest('/users/profile'),
  updateProfile: (userData: any) =>
    apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  getAllUsers: () => apiRequest('/users'),
  getUserById: (id: string) => apiRequest(`/users/${id}`),
  createUser: (userData: any) =>
    apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  updateUser: (id: string, userData: any) =>
    apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  deleteUser: (id: string) =>
    apiRequest(`/users/${id}`, {
      method: 'DELETE',
    }),
  toggleUserStatus: (id: string, isActive: boolean) =>
    apiRequest(`/users/${id}/toggle-status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
};

export const leaveAPI = {
  getLeaves: () => apiRequest('/leaves'),
  createLeave: (leaveData: any) =>
    apiRequest('/leaves', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    }),
  getLeaveById: (id: string) => apiRequest(`/leaves/${id}`),
  updateLeave: (id: string, leaveData: any) =>
    apiRequest(`/leaves/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leaveData),
    }),
  updateLeaveStatus: (id: string, status: string, reason?: string) =>
    apiRequest(`/leaves/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),
};

// Admin API endpoints
export const adminAPI = {
  // Dashboard
  getDashboardStats: (params?: any) => 
    apiRequest(`/admin/dashboard/stats${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getQuickStats: () => apiRequest('/admin/dashboard/quick-stats'),
  getDepartmentStats: (params?: any) => 
    apiRequest(`/admin/dashboard/department-stats${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getRecentActivities: (limit?: number) => 
    apiRequest(`/admin/dashboard/recent-activities${limit ? `?limit=${limit}` : ''}`),
  
  // Employees
  getEmployees: (params?: any) => 
    apiRequest(`/admin/employees${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getEmployeeById: (id: string) => apiRequest(`/admin/employees/${id}`),
  createEmployee: (employeeData: any) =>
    apiRequest('/admin/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    }),
  updateEmployee: (id: string, employeeData: any) =>
    apiRequest(`/admin/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    }),
  deleteEmployee: (id: string) =>
    apiRequest(`/admin/employees/${id}`, {
      method: 'DELETE',
    }),
  toggleEmployeeStatus: (id: string, isActive: boolean) =>
    apiRequest(`/admin/employees/${id}/toggle-status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
  
  // Leave Requests
  getLeaveRequests: (params?: any) => 
    apiRequest(`/admin/leave-requests${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getLeaveRequestById: (id: string) => apiRequest(`/admin/leave-requests/${id}`),
  updateLeaveRequestStatus: (id: string, status: string, comments?: string) =>
    apiRequest(`/admin/leave-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comments }),
    }),
  bulkUpdateLeaveRequests: (requestIds: string[], action: string, comments?: string) =>
    apiRequest('/admin/leave-requests/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ requestIds, action, comments }),
    }),
  
  // Leave Policies
  getLeavePolicies: (params?: any) => 
    apiRequest(`/admin/policies${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getLeavePolicyById: (id: string) => apiRequest(`/admin/policies/${id}`),
  createLeavePolicy: (policyData: any) =>
    apiRequest('/admin/policies', {
      method: 'POST',
      body: JSON.stringify(policyData),
    }),
  updateLeavePolicy: (id: string, policyData: any) =>
    apiRequest(`/admin/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(policyData),
    }),
  deleteLeavePolicy: (id: string) =>
    apiRequest(`/admin/policies/${id}`, {
      method: 'DELETE',
    }),
  
  // Reports
  getReports: (params?: any) => 
    apiRequest(`/admin/reports${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getLeaveReport: (params?: any) => 
    apiRequest(`/admin/reports/leave${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getEmployeeReport: (params?: any) => 
    apiRequest(`/admin/reports/employee${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getDepartmentReport: (params?: any) => 
    apiRequest(`/admin/reports/department${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  
  // Audit Logs
  getAuditLogs: (params?: any) => 
    apiRequest(`/admin/audit-logs${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getAuditLogById: (id: string) => apiRequest(`/admin/audit-logs/${id}`),
  
  // Settings
  getSettings: () => apiRequest('/admin/settings'),
  updateCompanyInfo: (companyData: any) =>
    apiRequest('/admin/settings/company', {
      method: 'PUT',
      body: JSON.stringify(companyData),
    }),
  updateNotificationSettings: (settings: any) =>
    apiRequest('/admin/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  updateSecuritySettings: (settings: any) =>
    apiRequest('/admin/settings/security', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};

// Manager API endpoints
export const managerAPI = {
  // Dashboard
  getDashboardStats: (params?: any) => 
    apiRequest(`/manager/dashboard/stats${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getQuickStats: () => apiRequest('/manager/dashboard/quick-stats'),
  getTeamPerformance: () => apiRequest('/manager/dashboard/team-performance'),
  getUpcomingLeaves: (limit?: number) => 
    apiRequest(`/manager/dashboard/upcoming-leaves${limit ? `?limit=${limit}` : ''}`),
  getRecentActivities: (limit?: number) => 
    apiRequest(`/manager/dashboard/recent-activities${limit ? `?limit=${limit}` : ''}`),
  getTeamLeaveBalance: () => apiRequest('/manager/dashboard/team-leave-balance'),
  getDepartmentStats: (params?: any) => 
    apiRequest(`/manager/dashboard/department-stats${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  
  // Team Management
  getTeamMembers: (params?: any) => 
    apiRequest(`/manager/team/members${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getTeamMemberById: (id: string) => apiRequest(`/manager/team/members/${id}`),
  updateTeamMember: (id: string, memberData: any) =>
    apiRequest(`/manager/team/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memberData),
    }),
  toggleTeamMemberStatus: (id: string, isActive: boolean) =>
    apiRequest(`/manager/team/members/${id}/toggle-status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
  getTeamStats: () => apiRequest('/manager/team/stats'),
  getTeamDepartments: () => apiRequest('/manager/team/departments'),
  getTeamMemberPerformance: (id: string) => apiRequest(`/manager/team/members/${id}/performance`),
  getTeamMemberRecentLeaves: (id: string, limit?: number) => 
    apiRequest(`/manager/team/members/${id}/recent-leaves${limit ? `?limit=${limit}` : ''}`),
  
  // Leave Approvals
  getLeaveApprovals: (params?: any) => 
    apiRequest(`/manager/approvals${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getLeaveApprovalById: (id: string) => apiRequest(`/manager/approvals/${id}`),
  processApprovalAction: (actionData: any) =>
    apiRequest('/manager/approvals/process', {
      method: 'POST',
      body: JSON.stringify(actionData),
    }),
  processBulkApprovalAction: (actionData: any) =>
    apiRequest('/manager/approvals/bulk-process', {
      method: 'POST',
      body: JSON.stringify(actionData),
    }),
  getApprovalStats: (params?: any) => 
    apiRequest(`/manager/approvals/stats${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getPendingCount: () => apiRequest('/manager/approvals/pending-count'),
  getUrgentApprovals: () => apiRequest('/manager/approvals/urgent'),
  getApprovalHistory: (params?: any) => 
    apiRequest(`/manager/approvals/history${params ? '?' + new URLSearchParams(params).toString() : ''}`),
};

// Employee API endpoints
export const employeeAPI = {
  // Dashboard
  getDashboardStats: (params?: any) => 
    apiRequest(`/employee/dashboard/stats${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getPersonalInfo: () => apiRequest('/employee/dashboard/personal-info'),
  getLeaveBalance: (params?: any) => 
    apiRequest(`/employee/dashboard/leave-balance${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getRecentRequests: (limit?: number) => 
    apiRequest(`/employee/dashboard/recent-requests${limit ? `?limit=${limit}` : ''}`),
  getUpcomingHolidays: (limit?: number) => 
    apiRequest(`/employee/dashboard/upcoming-holidays${limit ? `?limit=${limit}` : ''}`),
  getTeamInfo: () => apiRequest('/employee/dashboard/team-info'),
  getPerformanceMetrics: () => apiRequest('/employee/dashboard/performance'),
  getNotifications: (limit?: number) => 
    apiRequest(`/employee/dashboard/notifications${limit ? `?limit=${limit}` : ''}`),
  getQuickStats: (params?: any) => 
    apiRequest(`/employee/dashboard/quick-stats${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  
  // Leave Requests
  createLeaveRequest: (leaveData: any) =>
    apiRequest('/employee/leave-requests', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    }),
  getLeaveRequests: (params?: any) => 
    apiRequest(`/employee/leave-requests${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getLeaveRequestById: (id: string) => apiRequest(`/employee/leave-requests/${id}`),
  updateLeaveRequest: (id: string, leaveData: any) =>
    apiRequest(`/employee/leave-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leaveData),
    }),
  cancelLeaveRequest: (id: string) =>
    apiRequest(`/employee/leave-requests/${id}`, {
      method: 'DELETE',
    }),
  
  // Leave History
  getLeaveHistory: (params?: any) => 
    apiRequest(`/employee/leave-history${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getLeaveHistorySummary: (params?: any) => 
    apiRequest(`/employee/leave-history/summary${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  
  // Profile Management
  getProfile: () => apiRequest('/employee/profile'),
  updateProfile: (profileData: any) =>
    apiRequest('/employee/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
  updateAvatar: (avatarUrl: string) =>
    apiRequest('/employee/profile/avatar', {
      method: 'PUT',
      body: JSON.stringify({ avatar: avatarUrl }),
    }),
  updatePassword: (passwordData: any) =>
    apiRequest('/employee/profile/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    }),
  
  // Settings
  getNotificationPreferences: () => apiRequest('/employee/settings/notifications'),
  updateNotificationPreferences: (preferences: any) =>
    apiRequest('/employee/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),
  getCalendarPreferences: () => apiRequest('/employee/settings/calendar'),
  updateCalendarPreferences: (preferences: any) =>
    apiRequest('/employee/settings/calendar', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),
  getPrivacySettings: () => apiRequest('/employee/settings/privacy'),
  updatePrivacySettings: (settings: any) =>
    apiRequest('/employee/settings/privacy', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  getSecuritySettings: () => apiRequest('/employee/settings/security'),
  
  // Performance
  getPerformanceGoals: () => apiRequest('/employee/performance/goals'),
  getAchievements: () => apiRequest('/employee/performance/achievements'),
};
