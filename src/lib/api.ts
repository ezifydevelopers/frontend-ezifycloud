// API utility functions for authenticated requests
import { User } from '../types/auth';

import { LeaveRequest, LeaveBalance, LeavePolicy, LeaveType, LeaveStatus, AuditLog } from '../types/leave';
import {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  CreateUserRequest,
  UpdateUserRequest,
  ToggleUserStatusRequest,
  CreateLeaveRequest,
  UpdateLeaveRequest,
  UpdateLeaveStatusRequest,
  DashboardStatsParams,
  DashboardStats,
  ManagerDashboardStats,
  QuickStats,
  RecentActivity,
  EmployeeParams,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  LeaveRequestParams,
  UpdateLeaveRequestStatusRequest,
  BulkUpdateLeaveRequestsRequest,
  LeavePolicyParams,
  CreateLeavePolicyRequest,
  UpdateLeavePolicyRequest,
  ReportParams,
  LeaveReport,
  EmployeeReport,
  DepartmentReport,
  DepartmentStats,
  AuditLogParams,
  CompanyInfo,
  UpdateCompanyInfoRequest,
  NotificationSettings,
  UpdateNotificationSettingsRequest,
  SecuritySettings,
  UpdateSecuritySettingsRequest,
  TeamMemberParams,
  AddTeamMemberRequest,
  UpdateTeamMemberRequest,
  TeamStats,
  TeamMemberPerformance,
  LeaveApprovalParams,
  ProcessApprovalActionRequest,
  BulkProcessApprovalActionRequest,
  ApprovalStats,
  UrgentApproval,
  ApprovalHistoryParams,
  EmployeeDashboardStats,
  PersonalInfo,
  LeaveBalanceParams,
  UpcomingHoliday,
  TeamInfo,
  PerformanceMetrics,
  Notification,
  LeaveHistoryParams,
  LeaveHistorySummary,
  MonthStats,
  UpdateAvatarRequest,
  UpdatePasswordRequest,
  NotificationPreferences,
  UpdateNotificationPreferencesRequest,
  AppPreferences,
  UpdateAppPreferencesRequest,
  PrivacySettings,
  UpdatePrivacySettingsRequest,
  PerformanceGoal,
  Achievement,
  PaginatedResponse,
  Holiday,
  CreateHolidayRequest,
  UpdateHolidayRequest,
  HolidayStats,
  EmployeeSalary,
  MonthlySalary,
  SalaryDeduction,
  SalaryCalculation,
  SalaryStatistics
} from '../types/api';

import { APP_CONFIG } from './config';

const API_BASE_URL = APP_CONFIG.API_BASE_URL;

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Request queue to prevent multiple simultaneous requests
const requestQueue = new Map<string, Promise<unknown>>();

// Make authenticated API request with retry logic
export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  
  // Create a unique key for this request
  const requestKey = `${options.method || 'GET'}:${endpoint}`;
  
  // If the same request is already in progress, return the existing promise
  if (requestQueue.has(requestKey)) {
    console.log(`🔄 Request already in progress: ${requestKey}`);
    return requestQueue.get(requestKey) as Promise<T>;
  }
  
  const makeRequest = async (): Promise<T> => {
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    console.log(`🌐 API Request: ${config.method || 'GET'} ${API_BASE_URL}${endpoint}`);
    console.log(`🔑 Token: ${token ? token.substring(0, 20) + '...' : 'No token'}`);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid, clear auth data
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        
        if (response.status === 429) {
          // Rate limited - wait and retry once
          console.log('⏳ Rate limited, waiting 2 seconds before retry...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, config);
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || `HTTP error! status: ${retryResponse.status}`);
          }
          return retryResponse.json();
        }
        
        const errorData = await response.json().catch(() => ({}));
        
        // For validation errors, include the details
        if (response.status === 400 && errorData.details) {
          const validationDetails = errorData.details.map((d: {field: string, message: string}) => `${d.field}: ${d.message}`).join(', ');
          throw new Error(`${errorData.message || 'Validation failed'} - ${validationDetails}`);
        }
        
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log(`✅ API Response: ${response.status} ${endpoint}`, responseData);
      return responseData;
    } finally {
      // Remove from queue when done
      requestQueue.delete(requestKey);
    }
  };
  
  // Add to queue and return promise
  const promise = makeRequest();
  requestQueue.set(requestKey, promise);
  return promise;
};

// API endpoints
export const authAPI = {
  login: (email: string, password: string): Promise<ApiResponse<LoginResponse>> =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  register: (userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  
  forgotPassword: (email: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  
  resetPassword: (token: string, password: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
  
  changePassword: (currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

export const userAPI = {
  getProfile: (): Promise<ApiResponse<User>> => apiRequest('/users/profile'),
  updateProfile: (userData: UpdateProfileRequest): Promise<ApiResponse<User>> =>
    apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  getAllUsers: (): Promise<ApiResponse<PaginatedResponse<User>>> => apiRequest('/users'),
  getUserById: (id: string): Promise<ApiResponse<User>> => apiRequest(`/users/${id}`),
  createUser: (userData: CreateUserRequest): Promise<ApiResponse<User>> => {
    const { managerId, ...restData } = userData;
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify({
        ...restData,
        manager_id: managerId || null, // Convert camelCase to snake_case, send null if undefined
      }),
    });
  },
  updateUser: (id: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> => {
    const { managerId, ...restData } = userData;
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...restData,
        manager_id: managerId || null, // Convert camelCase to snake_case, send null if undefined
      }),
    });
  },
  deleteUser: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/users/${id}`, {
      method: 'DELETE',
    }),
  toggleUserStatus: (id: string, isActive: boolean): Promise<ApiResponse<User>> =>
    apiRequest(`/users/${id}/toggle-status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
};

export const leaveAPI = {
  getLeaves: (): Promise<ApiResponse<PaginatedResponse<LeaveRequest>>> => apiRequest('/leaves'),
  createLeave: (leaveData: CreateLeaveRequest): Promise<ApiResponse<LeaveRequest>> =>
    apiRequest('/leaves', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    }),
  getLeaveById: (id: string): Promise<ApiResponse<LeaveRequest>> => apiRequest(`/leaves/${id}`),
  updateLeave: (id: string, leaveData: UpdateLeaveRequest): Promise<ApiResponse<LeaveRequest>> =>
    apiRequest(`/leaves/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leaveData),
    }),
  updateLeaveStatus: (id: string, status: string, reason?: string): Promise<ApiResponse<LeaveRequest>> =>
    apiRequest(`/leaves/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),
};

// Admin API endpoints
export const adminAPI = {
  // Dashboard
  getDashboardStats: (params?: DashboardStatsParams): Promise<ApiResponse<DashboardStats>> => 
    apiRequest(`/admin/dashboard/stats${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getQuickStats: (): Promise<ApiResponse<QuickStats>> => apiRequest('/admin/dashboard/quick-stats'),
  getDepartmentStats: (params?: DashboardStatsParams): Promise<ApiResponse<DepartmentStats[]>> => 
    apiRequest(`/admin/dashboard/department-stats${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getRecentActivities: (limit?: number): Promise<ApiResponse<RecentActivity[]>> => 
    apiRequest(`/admin/dashboard/recent-activities${limit ? `?limit=${limit}` : ''}`),
  
  // Employees
  getEmployees: (params?: EmployeeParams): Promise<ApiResponse<PaginatedResponse<User>>> => 
    apiRequest(`/admin/employees${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getEmployeeById: (id: string): Promise<ApiResponse<User>> => apiRequest(`/admin/employees/${id}`),
  createEmployee: (employeeData: CreateEmployeeRequest): Promise<ApiResponse<User>> =>
    apiRequest('/admin/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    }),
  updateEmployee: (id: string, employeeData: UpdateEmployeeRequest): Promise<ApiResponse<User>> =>
    apiRequest(`/admin/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    }),
  deleteEmployee: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/admin/employees/${id}`, {
      method: 'DELETE',
    }),
  toggleEmployeeStatus: (id: string, isActive: boolean): Promise<ApiResponse<User>> =>
    apiRequest(`/admin/employees/${id}/toggle-status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
  bulkUpdateEmployeeStatus: (employeeIds: string[], isActive: boolean): Promise<ApiResponse<{ updated: number; failed: number }>> =>
    apiRequest('/admin/employees/bulk-update-status', {
      method: 'PATCH',
      body: JSON.stringify({ employeeIds, isActive }),
    }),
  bulkDeleteEmployees: (employeeIds: string[]): Promise<ApiResponse<{ deleted: number; failed: number }>> =>
    apiRequest('/admin/employees/bulk-delete', {
      method: 'DELETE',
      body: JSON.stringify({ employeeIds }),
    }),
  bulkUpdateEmployeeDepartment: (employeeIds: string[], department: string): Promise<ApiResponse<{ updated: number; failed: number }>> =>
    apiRequest('/admin/employees/bulk-update-department', {
      method: 'PATCH',
      body: JSON.stringify({ employeeIds, department }),
    }),
  exportEmployeesToCSV: (): Promise<Blob> =>
    fetch(`${API_BASE_URL}/admin/employees/export`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    }).then(response => {
      if (!response.ok) {
        throw new Error('Failed to export employees');
      }
      return response.blob();
    }),
  getEmployeeLeaveBalance: (id: string): Promise<ApiResponse<LeaveBalance>> => 
    apiRequest(`/admin/employees/${id}/leave-balance`),
  getUserLeaveBalance: (id: string, year?: string): Promise<ApiResponse<Record<string, unknown>>> => 
    apiRequest(`/admin/employees/${id}/leave-balance${year ? `?year=${year}` : ''}`),
  
  // Leave Requests
  getLeaveRequests: (params?: LeaveRequestParams): Promise<ApiResponse<PaginatedResponse<LeaveRequest>>> => 
    apiRequest(`/admin/leave-requests${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getLeaveRequestById: (id: string): Promise<ApiResponse<LeaveRequest>> => apiRequest(`/admin/leave-requests/${id}`),
  updateLeaveRequestStatus: (id: string, status: string, comments?: string): Promise<ApiResponse<LeaveRequest>> =>
    apiRequest(`/admin/leave-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comments }),
    }),
  bulkUpdateLeaveRequests: (requestIds: string[], action: string, comments?: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest('/admin/leave-requests/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ requestIds, action, comments }),
    }),
  
  // Leave Policies
  getLeavePolicies: (params?: LeavePolicyParams): Promise<ApiResponse<PaginatedResponse<LeavePolicy>>> => 
    apiRequest(`/admin/policies${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getLeavePolicyById: (id: string): Promise<ApiResponse<LeavePolicy>> => apiRequest(`/admin/policies/${id}`),
  createLeavePolicy: (policyData: CreateLeavePolicyRequest): Promise<ApiResponse<LeavePolicy>> =>
    apiRequest('/admin/policies', {
      method: 'POST',
      body: JSON.stringify(policyData),
    }),
  updateLeavePolicy: (id: string, policyData: UpdateLeavePolicyRequest): Promise<ApiResponse<LeavePolicy>> =>
    apiRequest(`/admin/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(policyData),
    }),
  deleteLeavePolicy: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/admin/policies/${id}`, {
      method: 'DELETE',
    }),
  toggleLeavePolicyStatus: (id: string, isActive: boolean): Promise<ApiResponse<LeavePolicy>> =>
    apiRequest(`/admin/policies/${id}/toggle-status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
  
  // Reports
  getReports: (params?: ReportParams): Promise<ApiResponse<{ reports: string[] }>> => 
    apiRequest(`/admin/reports${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getLeaveReport: (params?: ReportParams): Promise<ApiResponse<LeaveReport>> => 
    apiRequest(`/admin/reports/leave${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getEmployeeReport: (params?: ReportParams): Promise<ApiResponse<EmployeeReport>> => 
    apiRequest(`/admin/reports/employee${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getDepartmentReport: (params?: ReportParams): Promise<ApiResponse<DepartmentReport>> => 
    apiRequest(`/admin/reports/department${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  
  // Audit Logs
  getAuditLogs: (params?: AuditLogParams): Promise<ApiResponse<PaginatedResponse<AuditLog>>> => 
    apiRequest(`/admin/audit-logs${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getAuditLogById: (id: string): Promise<ApiResponse<AuditLog>> => apiRequest(`/admin/audit-logs/${id}`),
  
  // Settings
  getSettings: (): Promise<ApiResponse<{ company: CompanyInfo; notifications: NotificationSettings; security: SecuritySettings }>> => apiRequest('/admin/settings'),
  updateCompanyInfo: (companyData: UpdateCompanyInfoRequest): Promise<ApiResponse<CompanyInfo>> =>
    apiRequest('/admin/settings/company', {
      method: 'PUT',
      body: JSON.stringify(companyData),
    }),
  updateNotificationSettings: (settings: UpdateNotificationSettingsRequest): Promise<ApiResponse<NotificationSettings>> =>
    apiRequest('/admin/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  updateSecuritySettings: (settings: UpdateSecuritySettingsRequest): Promise<ApiResponse<SecuritySettings>> =>
    apiRequest('/admin/settings/security', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  // Attendance Management
  getAttendanceRecords: (params?: string): Promise<ApiResponse<AttendanceRecord[]>> => 
    apiRequest(`/admin/attendance${params ? '?' + params : ''}`),
  getAttendanceStats: (): Promise<ApiResponse<AttendanceStats>> => 
    apiRequest('/admin/attendance/stats'),
  getAttendanceRecordById: (id: string): Promise<ApiResponse<AttendanceRecord>> => 
    apiRequest(`/admin/attendance/${id}`),
  createAttendanceRecord: (recordData: CreateAttendanceRecordRequest): Promise<ApiResponse<AttendanceRecord>> =>
    apiRequest('/admin/attendance', {
      method: 'POST',
      body: JSON.stringify(recordData),
    }),
  updateAttendanceRecord: (id: string, recordData: UpdateAttendanceRecordRequest): Promise<ApiResponse<AttendanceRecord>> =>
    apiRequest(`/admin/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    }),
  deleteAttendanceRecord: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/admin/attendance/${id}`, {
      method: 'DELETE',
    }),
  getUserAttendanceRecords: (userId: string, params?: string): Promise<ApiResponse<AttendanceRecord[]>> => 
    apiRequest(`/admin/attendance/user/${userId}${params ? '?' + params : ''}`),

  // Holidays
  getHolidays: (params?: string): Promise<ApiResponse<PaginatedResponse<Holiday>>> => 
    apiRequest(`/admin/holidays${params ? '?' + params : ''}`),
  getHolidayById: (id: string): Promise<ApiResponse<Holiday>> => apiRequest(`/admin/holidays/${id}`),
  createHoliday: (holidayData: CreateHolidayRequest): Promise<ApiResponse<Holiday>> =>
    apiRequest('/admin/holidays', {
      method: 'POST',
      body: JSON.stringify(holidayData),
    }),
  updateHoliday: (id: string, holidayData: UpdateHolidayRequest): Promise<ApiResponse<Holiday>> =>
    apiRequest(`/admin/holidays/${id}`, {
      method: 'PUT',
      body: JSON.stringify(holidayData),
    }),
  deleteHoliday: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/admin/holidays/${id}`, {
      method: 'DELETE',
    }),
  toggleHolidayStatus: (id: string, isActive: boolean): Promise<ApiResponse<Holiday>> =>
    apiRequest(`/admin/holidays/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
  getHolidayStats: (): Promise<ApiResponse<HolidayStats>> => apiRequest('/admin/holidays/stats'),
  
  // Salary Management
  getEmployeeSalaries: (): Promise<ApiResponse<EmployeeSalary[]>> => apiRequest('/admin/salaries/employees'),
  getMonthlySalaries: (params?: { year?: number; month?: number }): Promise<ApiResponse<MonthlySalary[]>> => 
    apiRequest(`/admin/salaries/monthly${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  generateMonthlySalaries: (data: { year: number; month: number }): Promise<ApiResponse<MonthlySalary[]>> =>
    apiRequest('/admin/salaries/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approveMonthlySalary: (salaryId: string, data: { notes?: string }): Promise<ApiResponse<MonthlySalary>> =>
    apiRequest(`/admin/salaries/${salaryId}/approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getSalaryStatistics: (params?: { year?: number; month?: number }): Promise<ApiResponse<SalaryStatistics>> => 
    apiRequest(`/admin/salaries/statistics${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  calculateEmployeeSalary: (userId: string, params?: { year?: number; month?: number }): Promise<ApiResponse<SalaryCalculation>> => 
    apiRequest(`/admin/salaries/calculate/${userId}${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  createEmployeeSalary: (salaryData: any): Promise<ApiResponse<EmployeeSalary>> =>
    apiRequest('/admin/salaries/employees', {
      method: 'POST',
      body: JSON.stringify(salaryData),
    }),
  updateEmployeeSalary: (salaryId: string, salaryData: any): Promise<ApiResponse<EmployeeSalary>> =>
    apiRequest(`/admin/salaries/employees/${salaryId}`, {
      method: 'PUT',
      body: JSON.stringify(salaryData),
    }),
};

// Manager API endpoints
export const managerAPI = {
  // Dashboard
  getDashboardStats: (params?: DashboardStatsParams): Promise<ApiResponse<ManagerDashboardStats>> => 
    apiRequest(`/manager/dashboard/stats${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getQuickStats: (): Promise<ApiResponse<QuickStats>> => apiRequest('/manager/dashboard/quick-stats'),
  getTeamPerformance: (): Promise<ApiResponse<TeamStats>> => apiRequest('/manager/dashboard/team-performance'),
  getUpcomingLeaves: (limit?: number): Promise<ApiResponse<LeaveRequest[]>> => 
    apiRequest(`/manager/dashboard/upcoming-leaves${limit ? `?limit=${limit}` : ''}`),
  getRecentActivities: (limit?: number): Promise<ApiResponse<RecentActivity[]>> => 
    apiRequest(`/manager/dashboard/recent-activities${limit ? `?limit=${limit}` : ''}`),
  getTeamLeaveBalance: (): Promise<ApiResponse<LeaveBalance[]>> => apiRequest('/manager/dashboard/team-leave-balance'),
  getDepartmentStats: (params?: DashboardStatsParams): Promise<ApiResponse<DepartmentStats[]>> => 
    apiRequest(`/manager/dashboard/department-stats${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  
  // Team Management
  getTeamMembers: (params?: TeamMemberParams): Promise<ApiResponse<PaginatedResponse<unknown>>> => 
    apiRequest(`/manager/team/members${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getTeamMemberById: (id: string): Promise<ApiResponse<User>> => apiRequest(`/manager/team/members/${id}`),
  addTeamMember: (memberData: AddTeamMemberRequest): Promise<ApiResponse<User>> =>
    apiRequest('/manager/team/members', {
      method: 'POST',
      body: JSON.stringify(memberData),
    }),
  updateTeamMember: (id: string, memberData: UpdateTeamMemberRequest): Promise<ApiResponse<User>> =>
    apiRequest(`/manager/team/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memberData),
    }),
  toggleTeamMemberStatus: (id: string, isActive: boolean): Promise<ApiResponse<User>> =>
    apiRequest(`/manager/team/members/${id}/toggle-status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
  getTeamStats: (): Promise<ApiResponse<TeamStats>> => apiRequest('/manager/team/stats'),
  getTeamDepartments: (): Promise<ApiResponse<string[]>> => apiRequest('/manager/team/departments'),
  getTeamMemberPerformance: (id: string): Promise<ApiResponse<TeamMemberPerformance>> => apiRequest(`/manager/team/members/${id}/performance`),
  getTeamMemberRecentLeaves: (id: string, limit?: number): Promise<ApiResponse<LeaveRequest[]>> => 
    apiRequest(`/manager/team/members/${id}/recent-leaves${limit ? `?limit=${limit}` : ''}`),
  getTeamMemberLeaveBalance: (id: string): Promise<ApiResponse<LeaveBalance>> => 
    apiRequest(`/manager/team/members/${id}/leave-balance`),
  
  // Team Performance & Capacity
  getTeamPerformanceMetrics: (): Promise<ApiResponse<TeamPerformanceMetrics>> => 
    apiRequest('/manager/team/performance'),
  getTeamCapacityMetrics: (): Promise<ApiResponse<TeamCapacityData>> => 
    apiRequest('/manager/team/capacity'),
  
  // Leave Approvals
  getLeaveApprovals: (params?: LeaveApprovalParams): Promise<ApiResponse<PaginatedResponse<LeaveRequest>>> => 
    apiRequest(`/manager/approvals${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getLeaveApprovalById: (id: string): Promise<ApiResponse<LeaveRequest>> => apiRequest(`/manager/approvals/${id}`),
  processApprovalAction: (actionData: ProcessApprovalActionRequest): Promise<ApiResponse<LeaveRequest>> =>
    apiRequest('/manager/approvals/process', {
      method: 'POST',
      body: JSON.stringify(actionData),
    }),
  processBulkApprovalAction: (actionData: BulkProcessApprovalActionRequest): Promise<ApiResponse<{ message: string }>> =>
    apiRequest('/manager/approvals/bulk-process', {
      method: 'POST',
      body: JSON.stringify(actionData),
    }),
  getApprovalStats: (params?: DashboardStatsParams): Promise<ApiResponse<ApprovalStats>> => 
    apiRequest(`/manager/approvals/stats${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getPendingCount: (): Promise<ApiResponse<{ count: number }>> => apiRequest('/manager/approvals/pending-count'),
  getUrgentApprovals: (): Promise<ApiResponse<UrgentApproval[]>> => apiRequest('/manager/approvals/urgent'),
  getApprovalHistory: (params?: ApprovalHistoryParams): Promise<ApiResponse<PaginatedResponse<LeaveRequest>>> => 
    apiRequest(`/manager/approvals/history${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  
  // Leave Policies (Read-only access for managers)
  getLeavePolicies: (params?: LeavePolicyParams): Promise<ApiResponse<PaginatedResponse<LeavePolicy>>> => 
    apiRequest(`/manager/policies${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getLeavePolicyById: (id: string): Promise<ApiResponse<LeavePolicy>> => apiRequest(`/manager/policies/${id}`),
  getLeavePolicyStats: (): Promise<ApiResponse<{ totalPolicies: number; activePolicies: number; inactivePolicies: number; byLeaveType: Record<string, number> }>> => 
    apiRequest('/manager/policies/stats'),
  getLeavePolicyTypes: (): Promise<ApiResponse<string[]>> => apiRequest('/manager/policies/types'),
  
  // Manager Leave Requests
  createLeaveRequest: (leaveData: CreateLeaveRequest): Promise<ApiResponse<LeaveRequest>> =>
    apiRequest('/manager/leave-requests', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    }),
  getLeaveRequests: (params?: LeaveRequestParams): Promise<ApiResponse<PaginatedResponse<LeaveRequest>>> => 
    apiRequest(`/manager/leave-requests${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getLeaveRequestById: (id: string): Promise<ApiResponse<LeaveRequest>> => apiRequest(`/manager/leave-requests/${id}`),
  updateLeaveRequest: (id: string, updateData: UpdateLeaveRequest): Promise<ApiResponse<LeaveRequest>> =>
    apiRequest(`/manager/leave-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),
  cancelLeaveRequest: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/manager/leave-requests/${id}`, {
      method: 'DELETE',
    }),
  getLeaveHistory: (params?: LeaveHistoryParams): Promise<ApiResponse<PaginatedResponse<LeaveRequest>>> => 
    apiRequest(`/manager/leave-history${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getRecentRequests: (limit?: number, params?: Record<string, unknown>): Promise<ApiResponse<LeaveRequest[]>> => 
    apiRequest(`/manager/leave-requests/recent${limit ? `?limit=${limit}` : ''}${params ? '&' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getLeaveBalance: (params?: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> => 
    apiRequest(`/manager/leave-balance${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),

  // Profile Management
  getProfile: (): Promise<ApiResponse<User>> => apiRequest('/manager/profile'),
  updateProfile: (profileData: UpdateProfileRequest): Promise<ApiResponse<User>> =>
    apiRequest('/manager/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  // Holidays
  getUpcomingHolidays: (limit?: number): Promise<ApiResponse<UpcomingHoliday[]>> => 
    apiRequest(`/manager/holidays/upcoming${limit ? `?limit=${limit}` : ''}`),
  getHolidaysByYear: (year?: number): Promise<ApiResponse<UpcomingHoliday[]>> => 
    apiRequest(`/manager/holidays/year${year ? `?year=${year}` : ''}`),
  
  // Salary Management
  getTeamSalaries: (): Promise<ApiResponse<EmployeeSalary[]>> => apiRequest('/manager/salaries/team'),
  getTeamMonthlySalaries: (params?: { year?: number; month?: number }): Promise<ApiResponse<MonthlySalary[]>> => 
    apiRequest(`/manager/salaries/monthly${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  generateTeamMonthlySalaries: (data: { year: number; month: number }): Promise<ApiResponse<MonthlySalary[]>> =>
    apiRequest('/manager/salaries/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approveTeamMonthlySalary: (salaryId: string, data: { notes?: string }): Promise<ApiResponse<MonthlySalary>> =>
    apiRequest(`/manager/salaries/${salaryId}/approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getTeamSalaryStatistics: (params?: { year?: number; month?: number }): Promise<ApiResponse<SalaryStatistics>> => 
    apiRequest(`/manager/salaries/statistics${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  calculateTeamMemberSalary: (userId: string, params?: { year?: number; month?: number }): Promise<ApiResponse<SalaryCalculation>> => 
    apiRequest(`/manager/salaries/calculate/${userId}${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
};

// Employee API endpoints
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
  getLeaveRequests: (params?: LeaveHistoryParams): Promise<ApiResponse<PaginatedResponse<LeaveRequest>>> => 
    apiRequest(`/employee/leave-requests${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
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
