// ⚠️ DEPRECATED: This file has been refactored into modular API files
// Please use: import { boardAPI, workspaceAPI, ... } from '@/lib/api'
// The new structure is in lib/api/ directory
// This file is kept for backward compatibility but will be removed in future versions

// Re-export from the new modular structure
export * from './api/index';

// API utility functions for authenticated requests (legacy code below)
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

// Make authenticated API request with retry logic and offline support
export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  const method = (options.method || 'GET').toUpperCase();
  const isWriteOperation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  const isOffline = !navigator.onLine;
  
  // Create a unique key for this request
  const requestKey = `${method}:${endpoint}`;
  
  // If the same request is already in progress, return the existing promise
  if (requestQueue.has(requestKey)) {
    return requestQueue.get(requestKey) as Promise<T>;
  }
  
  const makeRequest = async (): Promise<T> => {
    // Handle offline mode
    if (isOffline) {
      if (isWriteOperation) {
        // Queue write operations
        const { actionQueue, ActionType } = await import('../services/actionQueue');
        
        // Determine action type from endpoint
        let actionType = ActionType.UPDATE_ITEM;
        if (endpoint.includes('/items') && method === 'POST') {
          actionType = ActionType.CREATE_ITEM;
        } else if (endpoint.includes('/items') && method === 'DELETE') {
          actionType = ActionType.DELETE_ITEM;
        } else if (endpoint.includes('/comments') && method === 'POST') {
          actionType = ActionType.CREATE_COMMENT;
        } else if (endpoint.includes('/approvals') && method === 'POST') {
          actionType = ActionType.SUBMIT_APPROVAL;
        } else if (endpoint.includes('/status') || endpoint.includes('/items') && method === 'PUT') {
          actionType = ActionType.UPDATE_STATUS;
        }
        
        const queueId = await actionQueue.enqueue({
          type: actionType,
          endpoint,
          method: method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
          body: options.body ? JSON.parse(options.body as string) : undefined,
          headers: options.headers as Record<string, string>,
        });
        
        // Return a mock response indicating the action was queued
        return {
          success: true,
          message: 'Action queued for sync when online',
          data: { queueId, queued: true },
        } as T;
      } else {
        // Try to get from cache for read operations
        const { offlineCache } = await import('../services/offlineCache');
        const cached = await offlineCache.get<T>(requestKey);
        
        if (cached) {
          console.log(`[Offline] Serving cached data for ${endpoint}`);
          return cached;
        }
        
        // No cache available - throw error
        throw new Error('No cached data available and you are offline');
      }
    }

    // Continue with normal request when online
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    // Debug logs disabled in production; keep silent by default

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      // Handle connection errors more gracefully
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Token expired, invalid, or forbidden - clear auth data and redirect to login
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          window.location.href = '/login';
          // Return a rejected promise to stop further processing
          return Promise.reject(new Error('Authentication required'));
        }
        
        if (response.status === 429) {
          // Rate limited - wait and retry once
          // silent retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, config);
          if (!retryResponse.ok) {
            const retryErrorData = await retryResponse.json().catch(() => ({}));
            let retryErrorMessage = 'An error occurred';
            if (retryErrorData.error) {
              retryErrorMessage = typeof retryErrorData.error === 'string' 
                ? retryErrorData.error 
                : retryErrorData.error?.message || JSON.stringify(retryErrorData.error);
            } else if (retryErrorData.message) {
              retryErrorMessage = retryErrorData.message;
            }
            throw new Error(retryErrorMessage || `HTTP error! status: ${retryResponse.status}`);
          }
          return retryResponse.json();
        }
        
        const errorData = await response.json().catch(() => ({}));
        
        // Extract error message from nested structure
        let errorMessage = 'An error occurred';
        if (errorData.error) {
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (errorData.error.message) {
            errorMessage = errorData.error.message;
          } else if (typeof errorData.error === 'object') {
            errorMessage = JSON.stringify(errorData.error);
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        // Log error details in development
        if (import.meta.env.DEV) {
          console.error('API Error Response:', {
            status: response.status,
            endpoint,
            error: errorMessage,
            details: errorData.details,
          });
        }
        
        // For 409 Conflict (like duplicate leave types), return the response instead of throwing
        if (response.status === 409) {
          // return conflict payload to caller
          return errorData;
        }
        
        // For validation errors, include the details
        if (response.status === 400 && errorData.details) {
          const validationDetails = errorData.details.map((d: {field: string, message: string}) => `${d.field}: ${d.message}`).join(', ');
          throw new Error(`${errorData.message || 'Validation failed'} - ${validationDetails}`);
        }
        
        // For 500 errors, show the actual error message from backend
        throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Cache successful GET responses
      if (method === 'GET' && response.ok) {
        try {
          const { offlineCache } = await import('../services/offlineCache');
          // Cache for 5 minutes
          await offlineCache.set(requestKey, responseData, 5 * 60 * 1000);
        } catch (error) {
          console.warn('Failed to cache response:', error);
        }
      }
      
      return responseData;
    } catch (error) {
      // Network errors (connection refused, timeout, etc.)
      if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
        const friendlyError = new Error('Unable to connect to the server. Please check your connection.');
        (friendlyError as any).isConnectionError = true;
        (friendlyError as any).originalError = error;
        console.error('❌ Connection Error:', friendlyError.message);
        throw friendlyError;
      }
      throw error;
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
  createLeavePolicy: (policyData: CreateLeavePolicyRequest, employeeType?: string): Promise<ApiResponse<LeavePolicy>> => {
    const url = employeeType 
      ? `/admin/policies?employeeType=${employeeType}`
      : '/admin/policies';
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(policyData),
    });
  },
  updateLeavePolicy: (id: string, policyData: UpdateLeavePolicyRequest, employeeType?: string): Promise<ApiResponse<LeavePolicy>> => {
    const url = employeeType 
      ? `/admin/policies/${id}?employeeType=${employeeType}`
      : `/admin/policies/${id}`;
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(policyData),
    });
  },
  deleteLeavePolicy: (id: string, employeeType?: string): Promise<ApiResponse<{ message: string }>> => {
    const url = employeeType 
      ? `/admin/policies/${id}?employeeType=${employeeType}`
      : `/admin/policies/${id}`;
    return apiRequest(url, {
      method: 'DELETE',
    });
  },
  toggleLeavePolicyStatus: (id: string, isActive: boolean, employeeType?: string): Promise<ApiResponse<LeavePolicy>> => {
    const url = employeeType 
      ? `/admin/policies/${id}/toggle-status?employeeType=${employeeType}`
      : `/admin/policies/${id}/toggle-status`;
    return apiRequest(url, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },
  getLeavePolicyTypes: (): Promise<ApiResponse<string[]>> => apiRequest('/admin/policies/types'),
  
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

// Workspace API endpoints
export const workspaceAPI = {
  // Workspace CRUD
  createWorkspace: (data: { name: string; description?: string; logo?: string; settings?: Record<string, unknown> }): Promise<ApiResponse<{ workspace: unknown; member: unknown }>> => {
    // Clean the data before sending - remove undefined and empty string logo
    const cleanedData: Record<string, unknown> = {
      name: data.name,
    };
    if (data.description !== undefined && data.description !== '') {
      cleanedData.description = data.description;
    }
    if (data.logo !== undefined && data.logo !== '') {
      cleanedData.logo = data.logo;
    }
    if (data.settings) {
      cleanedData.settings = data.settings;
    }
    console.log('🔍 API: Sending workspace data:', cleanedData);
    return apiRequest('/workspaces', {
      method: 'POST',
      body: JSON.stringify(cleanedData),
    });
  },
  getWorkspaces: (params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<PaginatedResponse<unknown>>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.search !== undefined && params.search !== null && params.search !== '') {
        queryParams.append('search', params.search);
      }
    }
    const queryString = queryParams.toString();
    return apiRequest(`/workspaces${queryString ? '?' + queryString : ''}`);
  },
  /**
   * Get all workspaces for the current user (alias for getWorkspaces)
   */
  getUserWorkspaces: (params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<PaginatedResponse<unknown>>> => {
    return workspaceAPI.getWorkspaces(params);
  },
  getWorkspaceById: (id: string): Promise<ApiResponse<unknown>> => apiRequest(`/workspaces/${id}`),
  updateWorkspace: (id: string, data: { name?: string; description?: string; logo?: string; settings?: Record<string, unknown> }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/workspaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteWorkspace: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/workspaces/${id}`, {
      method: 'DELETE',
    }),
  
  // Member management
  getWorkspaceMembers: (workspaceId: string): Promise<ApiResponse<unknown[]>> => apiRequest(`/workspaces/${workspaceId}/members`),
  getInvitations: (workspaceId: string, status: 'pending' | 'accepted' | 'all' = 'pending'): Promise<ApiResponse<unknown[]>> =>
    apiRequest(`/workspaces/${workspaceId}/invitations${status ? `?status=${status}` : ''}`),
  transferOwnership: (workspaceId: string, newOwnerUserId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/workspaces/${workspaceId}/members/transfer-ownership`, {
      method: 'POST',
      body: JSON.stringify({ newOwnerUserId }),
    }),
  inviteMember: (workspaceId: string, data: { email: string; role: string }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/workspaces/${workspaceId}/members/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resendInvitation: (workspaceId: string, inviteId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/workspaces/${workspaceId}/invitations/${inviteId}/resend`, { method: 'POST' }),
  cancelInvitation: (workspaceId: string, inviteId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/workspaces/${workspaceId}/invitations/${inviteId}`, { method: 'DELETE' }),
  updateMemberRole: (workspaceId: string, memberId: string, role: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/workspaces/${workspaceId}/members/${memberId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  removeMember: (workspaceId: string, memberId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'DELETE',
    }),
  acceptInvitation: (token: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/workspaces/invitations/${token}/accept`, {
      method: 'POST',
    }),
};

// Board API endpoints
export const boardAPI = {
  // Board CRUD
  createBoard: (data: { workspaceId: string; name: string; type: string; description?: string; color?: string; icon?: string }): Promise<ApiResponse<unknown>> =>
    apiRequest('/boards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getWorkspaceBoards: (workspaceId: string, params?: { page?: number; limit?: number; search?: string; type?: string; isArchived?: boolean }): Promise<ApiResponse<PaginatedResponse<unknown>>> =>
    apiRequest(`/boards/workspace/${workspaceId}${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getBoardById: (id: string): Promise<ApiResponse<unknown>> => apiRequest(`/boards/${id}`),
  updateBoard: (id: string, data: { name?: string; description?: string; color?: string; icon?: string; isPublic?: boolean; isArchived?: boolean }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteBoard: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/boards/${id}`, {
      method: 'DELETE',
    }),
  
  // Column management
  getBoardColumns: (boardId: string): Promise<ApiResponse<unknown[]>> => apiRequest(`/boards/${boardId}/columns`),
  createColumn: (boardId: string, data: { name: string; type: string; position?: number; width?: number; required?: boolean; settings?: Record<string, unknown> }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/boards/${boardId}/columns`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateColumn: (id: string, data: { name?: string; type?: string; position?: number; width?: number; required?: boolean; isHidden?: boolean; settings?: Record<string, unknown> }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/boards/columns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteColumn: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/boards/columns/${id}`, {
      method: 'DELETE',
    }),
  
  // Item management
  getBoardItems: (boardId: string, params?: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: string }): Promise<ApiResponse<PaginatedResponse<unknown>>> =>
    apiRequest(`/boards/${boardId}/items${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  createItem: (boardId: string, data: { name: string; status?: string; cells?: Record<string, unknown> }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/boards/${boardId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateItem: (id: string, data: { name?: string; status?: string; cells?: Record<string, unknown> }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/boards/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteItem: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/boards/items/${id}`, {
      method: 'DELETE',
    }),
  getItemActivities: (itemId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<{ activities: unknown[]; total: number }>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    }
    const queryString = queryParams.toString();
    return apiRequest(`/boards/items/${itemId}/activities${queryString ? '?' + queryString : ''}`);
  },
};

export const commentAPI = {
  // Create comment
  createComment: (data: { itemId: string; content: string; mentions?: string[]; isPrivate?: boolean; parentId?: string }): Promise<ApiResponse<unknown>> =>
    apiRequest('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Get comments for an item
  getItemComments: (itemId: string, params?: { parentId?: string | null; includeDeleted?: boolean }): Promise<ApiResponse<unknown[]>> =>
    apiRequest(`/comments/item/${itemId}${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  
  // Get comment by ID
  getCommentById: (commentId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/comments/${commentId}`),
  
  // Update comment
  updateComment: (commentId: string, data: { content?: string; mentions?: string[]; isPrivate?: boolean }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Delete comment
  deleteComment: (commentId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/comments/${commentId}`, {
      method: 'DELETE',
    }),
  
  // Add reaction
  addReaction: (commentId: string, emoji: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/comments/${commentId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),
};

export const automationAPI = {
  // Create automation
  createAutomation: (data: {
    boardId: string;
    name: string;
    trigger: Record<string, unknown>;
    actions: Array<Record<string, unknown>>;
    conditions?: Record<string, unknown>;
    isActive?: boolean;
  }): Promise<ApiResponse<unknown>> =>
    apiRequest('/automations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get automations
  getAutomations: (params?: {
    boardId?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ data: unknown[]; pagination: PaginatedResponse<unknown> }>> => {
    const query = new URLSearchParams();
    if (params?.boardId) query.append('boardId', params.boardId);
    if (typeof params?.isActive === 'boolean') query.append('isActive', String(params.isActive));
    if (params?.search && params.search.trim() !== '') query.append('search', params.search.trim());
    if (typeof params?.page === 'number') query.append('page', String(params.page));
    if (typeof params?.limit === 'number') query.append('limit', String(params.limit));
    const qs = query.toString();
    return apiRequest(`/automations${qs ? `?${qs}` : ''}`);
  },

  // Get automation by ID
  getAutomationById: (id: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/automations/${id}`),

  // Update automation
  updateAutomation: (id: string, data: {
    name?: string;
    trigger?: Record<string, unknown>;
    actions?: Array<Record<string, unknown>>;
    conditions?: Record<string, unknown>;
    isActive?: boolean;
  }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/automations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete automation
  deleteAutomation: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/automations/${id}`, {
      method: 'DELETE',
    }),

  // Toggle automation
  toggleAutomation: (id: string, isActive: boolean): Promise<ApiResponse<unknown>> =>
    apiRequest(`/automations/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

  // Test automation
  testAutomation: (id: string, itemId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/automations/${id}/test`, {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    }),
};

export const aiAPI = {
  // Generate text (description, comment, email, summary)
  generateText: (data: {
    type: 'description' | 'comment' | 'email' | 'summary';
    context?: Record<string, unknown>;
  }): Promise<ApiResponse<{ text: string; confidence?: number; metadata?: Record<string, unknown> }>> =>
    apiRequest('/ai/generate-text', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Smart semantic search
  smartSearch: (data: {
    query: string;
    boardId?: string;
    workspaceId?: string;
    limit?: number;
    filters?: Record<string, unknown>;
  }): Promise<ApiResponse<{
    results: Array<{
      itemId: string;
      itemName: string;
      relevanceScore: number;
      matchedFields: string[];
    }>;
    queryInterpretation?: string;
    suggestedFilters?: Record<string, unknown>;
  }>> =>
    apiRequest('/ai/smart-search', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Generate predictions
  generatePrediction: (data: {
    type: 'payment_delay' | 'approval_time' | 'risk_score';
    itemId?: string;
    itemData?: Record<string, unknown>;
  }): Promise<ApiResponse<{
    prediction: number | string;
    confidence: number;
    factors?: Array<{ factor: string; impact: number }>;
    recommendation?: string;
  }>> =>
    apiRequest('/ai/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Generate insights
  generateInsights: (data: {
    type: 'board_summary' | 'team_insights' | 'trends';
    boardId?: string;
    workspaceId?: string;
    timeframe?: 'week' | 'month' | 'quarter' | 'year';
  }): Promise<ApiResponse<{
    summary: string;
    metrics?: Array<{ label: string; value: string | number }>;
    trends?: Array<{ label: string; description: string; direction: string }>;
    insights?: string[];
  }>> =>
    apiRequest('/ai/insights', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Auto-tagging
  autoTagging: (data: {
    itemId: string;
    boardId?: string;
    context?: {
      itemName?: string;
      description?: string;
      lineItems?: Array<{
        name?: string;
        description?: string;
        quantity?: number;
        price?: number;
        unitPrice?: number;
      }>;
      amount?: number;
      existingTags?: string[];
      existingCategory?: string;
    };
  }): Promise<ApiResponse<{
    tags: string[];
    category?: string;
    confidence: number;
    suggestions?: Array<{
      tag: string;
      reason: string;
      confidence: number;
    }>;
    groupingSuggestions?: Array<{
      groupName: string;
      items: string[];
      reason: string;
    }>;
  }>> =>
    apiRequest('/ai/auto-tagging', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Formula suggestions
  suggestFormulas: (data: {
    itemId?: string;
    boardId: string;
    context?: {
      lineItems?: Array<{
        quantity?: number;
        price?: number;
        unitPrice?: number;
        tax?: number;
      }>;
      subtotal?: number;
      amount?: number;
      taxRate?: number;
      discount?: number;
      existingFormulas?: Record<string, string>;
    };
    type?: 'total' | 'tax' | 'discount' | 'subtotal' | 'custom';
  }): Promise<ApiResponse<{
    suggestions: Array<{
      name: string;
      formula: string;
      description: string;
      targetColumn?: string;
      confidence: number;
      validation?: {
        isValid: boolean;
        errors?: string[];
        preview?: number;
      };
    }>;
    taxSuggestions?: Array<{
      rate: number;
      type: 'percentage' | 'flat';
      description: string;
      calculatedAmount?: number;
      basedOn?: string;
    }>;
  }>> =>
    apiRequest('/ai/suggest-formulas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Email draft generation
  generateEmailDraft: (data: {
    itemId?: string;
    type?: 'invoice' | 'reminder' | 'payment_confirmation' | 'general';
    context?: {
      itemName?: string;
      recipientName?: string;
      recipientEmail?: string;
      amount?: number;
      dueDate?: string;
      invoiceNumber?: string;
      lineItems?: Array<{
        name?: string;
        description?: string;
        quantity?: number;
        price?: number;
        unitPrice?: number;
      }>;
      status?: string;
      notes?: string;
      tone?: 'professional' | 'friendly' | 'formal' | 'casual';
    };
  }): Promise<ApiResponse<{
    subject: string;
    body: string;
    tone: 'professional' | 'friendly' | 'formal' | 'casual';
    includesInvoiceDetails: boolean;
    suggestions?: string[];
  }>> =>
    apiRequest('/ai/email-draft', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const fileAPI = {
  // Upload file (base64)
  uploadFile: (data: { 
    itemId: string; 
    fileName: string; 
    fileData: string; 
    mimeType: string; 
    fileSize: number;
    folder?: string;
    replaceFileId?: string; // For versioning
  }): Promise<ApiResponse<unknown>> =>
    apiRequest('/files/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Get allowed file types configuration
  getAllowedFileTypes: (): Promise<ApiResponse<{
    allowedTypes: Record<string, {
      mimeTypes: string[];
      extensions: string[];
      maxSize: number;
    }>;
    globalMaxSize: number;
    enabledCategories: Record<string, boolean>;
  }>> =>
    apiRequest('/files/allowed-types'),
  
  // Get files for an item
  getItemFiles: (itemId: string, filters?: { folder?: string | null; includeVersions?: boolean }): Promise<ApiResponse<unknown[]>> => {
    const params = new URLSearchParams();
    if (filters?.folder !== undefined) {
      params.append('folder', filters.folder || '');
    }
    if (filters?.includeVersions) {
      params.append('includeVersions', 'true');
    }
    const query = params.toString();
    return apiRequest(`/files/item/${itemId}${query ? `?${query}` : ''}`);
  },
  
  // Get files by folder
  getFilesByFolder: (itemId: string, folder?: string): Promise<ApiResponse<unknown[]>> => {
    const params = new URLSearchParams();
    if (folder) {
      params.append('folder', folder);
    }
    const query = params.toString();
    return apiRequest(`/files/item/${itemId}/folder${query ? `?${query}` : ''}`);
  },
  
  // Get folder structure
  getFolderStructure: (itemId: string): Promise<ApiResponse<string[]>> =>
    apiRequest(`/files/item/${itemId}/folders`),
  
  // Get file versions
  getFileVersions: (fileId: string): Promise<ApiResponse<unknown[]>> =>
    apiRequest(`/files/${fileId}/versions`),
  
  // Get file by ID
  getFileById: (fileId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/files/${fileId}`),
  
  // Download file
  downloadFile: (fileId: string): Promise<Blob> => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9001/api';
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE_URL}/files/${fileId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }).then(response => {
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      return response.blob();
    });
  },
  
  // Delete file
  deleteFile: (fileId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/files/${fileId}`, {
      method: 'DELETE',
    }),
  
  // Get file preview URL
  getFilePreviewUrl: (fileId: string): string => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9001/api';
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/files/${fileId}/download?token=${token}`;
  },

  // Rename file
  renameFile: (fileId: string, newFileName: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/files/${fileId}/rename`, {
      method: 'PATCH',
      body: JSON.stringify({ newFileName }),
    }),

  // Move file to another item
  moveFile: (fileId: string, targetItemId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/files/${fileId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ targetItemId }),
    }),

  // Bulk download - get files list
  getFilesForBulkDownload: (itemIds: string[]): Promise<ApiResponse<unknown[]>> =>
    apiRequest('/files/bulk-download', {
      method: 'POST',
      body: JSON.stringify({ itemIds }),
    }),

  // Replace file (upload new version)
  replaceFile: (fileId: string, file: File, folder?: string): Promise<ApiResponse<unknown>> => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }
    formData.append('replaceFileId', fileId);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9001/api';
    const token = localStorage.getItem('token');
    
    return fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }).then(response => response.json());
  },
};

// Audit API endpoints
export const auditAPI = {
  getAuditLogs: (params?: {
    userId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    itemId?: string;
    dateFrom?: string;
    dateTo?: string;
    fieldName?: string;
  }): Promise<ApiResponse<{ logs: unknown[]; total: number; page: number; limit: number; totalPages: number }>> =>
    apiRequest(`/audit${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getResourceAuditLogs: (resourceType: string, resourceId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<{ logs: unknown[]; total: number; page: number; limit: number; totalPages: number }>> =>
    apiRequest(`/audit/resource/${resourceType}/${resourceId}${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getTargetAuditLogs: (targetType: string, targetId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<{ logs: unknown[]; total: number; page: number; limit: number; totalPages: number }>> =>
    apiRequest(`/audit/target/${targetType}/${targetId}${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getFieldHistory: (itemId: string, fieldName: string): Promise<ApiResponse<unknown[]>> =>
    apiRequest(`/audit/field/${itemId}/${fieldName}`),
  exportAuditLogs: (params?: {
    format?: 'csv' | 'json';
    userId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> => {
    const queryParams = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return fetch(`${API_BASE_URL}/audit/export${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }).then(res => res.blob());
  },
};

// Backup API endpoints
export const backupAPI = {
  createDatabaseBackup: (): Promise<ApiResponse<{ file: string; timestamp: string }>> =>
    apiRequest('/backup/database', { method: 'POST' }),
  createFilesBackup: (): Promise<ApiResponse<{ file: string; timestamp: string }>> =>
    apiRequest('/backup/files', { method: 'POST' }),
  createDataExport: (): Promise<ApiResponse<{ file: string; timestamp: string }>> =>
    apiRequest('/backup/export', { method: 'POST' }),
  listBackups: (type?: 'database' | 'files' | 'data'): Promise<ApiResponse<{ backups: string[]; count: number }>> =>
    apiRequest(`/backup/list${type ? `?type=${type}` : ''}`),
  cleanupBackups: (type?: 'database' | 'files' | 'data', keepCount?: number): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/backup/cleanup${type || keepCount ? '?' + new URLSearchParams({ type: type || '', keepCount: keepCount?.toString() || '' }).toString() : ''}`, { method: 'POST' }),
};

export const permissionAPI = {
  // Get permissions for a resource
  getPermissions: (
    resource: 'workspace' | 'board' | 'item' | 'column',
    resourceId: string
  ): Promise<ApiResponse<{
    read: boolean;
    write: boolean;
    delete: boolean;
    manage?: boolean;
  }>> =>
    apiRequest(`/permissions?resource=${resource}&resourceId=${resourceId}`),

  // Check specific permission
  checkPermission: (
    resource: 'workspace' | 'board' | 'item' | 'column',
    resourceId: string,
    action: 'read' | 'write' | 'delete' | 'manage'
  ): Promise<ApiResponse<{ hasPermission: boolean }>> =>
    apiRequest(`/permissions/check?resource=${resource}&resourceId=${resourceId}&action=${action}`),

  // Update board permissions
  updateBoardPermissions: (
    boardId: string,
    permissions: Record<string, {
      read: boolean;
      write: boolean;
      delete: boolean;
      manage?: boolean;
    }>
  ): Promise<ApiResponse<unknown>> =>
    apiRequest(`/permissions/board/${boardId}`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    }),

  // Update column permissions
  updateColumnPermissions: (
    columnId: string,
    permissions: {
      read?: boolean | Record<string, boolean>;
      write?: boolean | Record<string, boolean>;
      delete?: boolean | Record<string, boolean>;
    }
  ): Promise<ApiResponse<unknown>> =>
    apiRequest(`/permissions/column/${columnId}`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    }),

  // Assign workspace role
  assignWorkspaceRole: (
    workspaceId: string,
    targetUserId: string,
    role: 'owner' | 'admin' | 'finance' | 'member' | 'viewer'
  ): Promise<ApiResponse<unknown>> =>
    apiRequest(`/permissions/workspace/${workspaceId}/role`, {
      method: 'POST',
      body: JSON.stringify({ targetUserId, role }),
    }),

  // Assign board role
  assignBoardRole: (
    boardId: string,
    targetUserId: string,
    role: 'owner' | 'admin' | 'editor' | 'viewer'
  ): Promise<ApiResponse<unknown>> =>
    apiRequest(`/permissions/board/${boardId}/role`, {
      method: 'POST',
      body: JSON.stringify({ targetUserId, role }),
    }),

  // Assign board permissions to user
  assignBoardPermissionsToUser: (
    boardId: string,
    targetUserId: string,
    permissions: {
      read: boolean;
      write: boolean;
      delete: boolean;
      manage?: boolean;
    }
  ): Promise<ApiResponse<unknown>> =>
    apiRequest(`/permissions/board/${boardId}/user/${targetUserId}`, {
      method: 'POST',
      body: JSON.stringify({ permissions }),
    }),

  // Assign board permissions to role
  assignBoardPermissionsToRole: (
    boardId: string,
    role: string,
    permissions: {
      read: boolean;
      write: boolean;
      delete: boolean;
      manage?: boolean;
    }
  ): Promise<ApiResponse<unknown>> =>
    apiRequest(`/permissions/board/${boardId}/role/${role}`, {
      method: 'POST',
      body: JSON.stringify({ permissions }),
    }),

  // Assign column role
  assignColumnRole: (
    columnId: string,
    targetUserId: string,
    role: 'owner' | 'editor' | 'viewer'
  ): Promise<ApiResponse<unknown>> =>
    apiRequest(`/permissions/column/${columnId}/role`, {
      method: 'POST',
      body: JSON.stringify({ targetUserId, role }),
    }),

  // Assign cell permissions
  assignCellPermissions: (
    columnId: string,
    permissions: {
      mode: 'owner_only' | 'assignee_only' | 'team_members' | 'all';
      allowedUsers?: string[];
      allowedRoles?: string[];
    }
  ): Promise<ApiResponse<unknown>> =>
    apiRequest(`/permissions/column/${columnId}/cell-permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissions }),
    }),

  // Get effective permissions (with inheritance)
  getEffectivePermissions: (
    resource: 'workspace' | 'board' | 'column',
    resourceId: string
  ): Promise<ApiResponse<{
    read: boolean;
    write: boolean;
    delete: boolean;
    manage?: boolean;
    inherited: boolean;
    overrides: Record<string, boolean>;
  }>> =>
    apiRequest(`/permissions/effective?resource=${resource}&resourceId=${resourceId}`),

  // Row-level security
  getFilteredItems: (
    boardId: string,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      filterBy?: 'all' | 'assigned' | 'created' | 'department' | 'custom';
      departmentId?: string;
      customFilters?: Array<{
        columnId: string;
        operator?: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
        value?: unknown;
      }>;
    }
  ): Promise<ApiResponse<{
    items: unknown[];
    total: number;
    page: number;
    limit: number;
  }>> => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.search) params.append('search', options.search);
    if (options?.status) params.append('status', options.status);
    if (options?.filterBy) params.append('filterBy', options.filterBy);
    if (options?.departmentId) params.append('departmentId', options.departmentId);
    if (options?.customFilters) params.append('customFilters', JSON.stringify(options.customFilters));
    return apiRequest(`/permissions/board/${boardId}/items/filtered?${params.toString()}`);
  },

  getAssignedItems: (
    boardId: string,
    options?: { page?: number; limit?: number }
  ): Promise<ApiResponse<{
    items: unknown[];
    total: number;
    page: number;
    limit: number;
  }>> => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    return apiRequest(`/permissions/board/${boardId}/items/assigned?${params.toString()}`);
  },

  // Column visibility
  getVisibleColumns: (
    boardId: string,
    itemId?: string
  ): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    type: string;
    canView: boolean;
    isSensitive: boolean;
    isHidden: boolean;
  }>>> => {
    const params = new URLSearchParams();
    if (itemId) params.append('itemId', itemId);
    return apiRequest(`/permissions/board/${boardId}/columns/visible?${params.toString()}`);
  },

  canViewColumn: (
    columnId: string,
    itemId?: string
  ): Promise<ApiResponse<{ canView: boolean }>> => {
    const params = new URLSearchParams();
    if (itemId) params.append('itemId', itemId);
    return apiRequest(`/permissions/column/${columnId}/visibility?${params.toString()}`);
  },
};


export const dashboardAPI = {
  // Create dashboard
  createDashboard: (data: {
    workspaceId: string;
    name: string;
    description?: string;
    widgets?: unknown[];
    isPublic?: boolean;
  }): Promise<ApiResponse<unknown>> =>
    apiRequest('/dashboards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get workspace dashboards
  getWorkspaceDashboards: (workspaceId: string): Promise<ApiResponse<unknown[]>> =>
    apiRequest(`/dashboards/workspace/${workspaceId}`),

  // Get dashboard by ID
  getDashboardById: (dashboardId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/dashboards/${dashboardId}`),

  // Update dashboard
  updateDashboard: (dashboardId: string, data: {
    name?: string;
    description?: string;
    widgets?: unknown[];
    isPublic?: boolean;
  }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/dashboards/${dashboardId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete dashboard
  deleteDashboard: (dashboardId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/dashboards/${dashboardId}`, {
      method: 'DELETE',
    }),

  // Share dashboard
  shareDashboard: (dashboardId: string, sharedWith: string[]): Promise<ApiResponse<unknown>> =>
    apiRequest(`/dashboards/${dashboardId}/share`, {
      method: 'POST',
      body: JSON.stringify({ sharedWith }),
    }),

  // Get board metrics
  getBoardMetrics: (boardId: string, filters?: {
    dateFrom?: string;
    dateTo?: string;
    status?: string[];
  }): Promise<ApiResponse<{
    totalItems: number;
    totalValue: number;
    averageValue: number;
    itemsByStatus: Record<string, number>;
    itemsByDate: Array<{ date: string; count: number; value: number }>;
    topItems: Array<{ id: string; name: string; value: number }>;
  }>> =>
    apiRequest(`/dashboards/board/${boardId}/metrics${filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : ''}`),

  // Calculate widget data
  calculateWidgetData: (widget: unknown): Promise<ApiResponse<unknown>> =>
    apiRequest('/dashboards/widgets/calculate', {
      method: 'POST',
      body: JSON.stringify(widget),
    }),
};

// Analytics API endpoints
export const analyticsAPI = {
  getKeyMetrics: (params?: {
    workspaceId?: string;
    boardId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string[];
  }): Promise<ApiResponse<{
    totalInvoices: number;
    totalAmount: number;
    pendingApprovalsCount: number;
    overdueInvoicesCount: number;
    averageApprovalTime: number;
    paymentRate: number;
  }>> =>
    apiRequest(`/analytics/metrics${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getTrends: (params?: {
    workspaceId?: string;
    boardId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string[];
  }): Promise<ApiResponse<{
    invoiceVolume: Array<{ date: string; value: number }>;
    amountTrends: Array<{ date: string; value: number }>;
    approvalTimeTrends: Array<{ date: string; value: number }>;
    paymentTrends: Array<{ date: string; value: number }>;
  }>> =>
    apiRequest(`/analytics/trends${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  getAnalytics: (params?: {
    workspaceId?: string;
    boardId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string[];
  }): Promise<ApiResponse<{
    keyMetrics: {
      totalInvoices: number;
      totalAmount: number;
      pendingApprovalsCount: number;
      overdueInvoicesCount: number;
      averageApprovalTime: number;
      paymentRate: number;
    };
    trends: {
      invoiceVolume: Array<{ date: string; value: number }>;
      amountTrends: Array<{ date: string; value: number }>;
      approvalTimeTrends: Array<{ date: string; value: number }>;
      paymentTrends: Array<{ date: string; value: number }>;
    };
    period: {
      startDate: string;
      endDate: string;
    };
  }>> =>
    apiRequest(`/analytics${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
};

// Customization API endpoints
export const customizationAPI = {
  // Favorites
  addFavorite: (boardId: string): Promise<ApiResponse<unknown>> =>
    apiRequest('/customization/favorites', {
      method: 'POST',
      body: JSON.stringify({ boardId }),
    }),
  removeFavorite: (boardId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/customization/favorites/${boardId}`, {
      method: 'DELETE',
    }),
  getFavorites: (): Promise<ApiResponse<Array<{
    id: string;
    boardId: string;
    position: number;
    board?: {
      id: string;
      name: string;
      color?: string;
      icon?: string;
    };
  }>>> =>
    apiRequest('/customization/favorites'),
  reorderFavorites: (boardIds: string[]): Promise<ApiResponse<{ message: string }>> =>
    apiRequest('/customization/favorites/reorder', {
      method: 'PUT',
      body: JSON.stringify({ boardIds }),
    }),

  // Recent boards
  trackAccess: (boardId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest('/customization/recent', {
      method: 'POST',
      body: JSON.stringify({ boardId }),
    }),
  getRecentBoards: (limit?: number): Promise<ApiResponse<Array<{
    id: string;
    boardId: string;
    lastAccessedAt: string;
    accessCount: number;
    board?: {
      id: string;
      name: string;
      color?: string;
      icon?: string;
    };
  }>>> =>
    apiRequest(`/customization/recent${limit ? `?limit=${limit}` : ''}`),

  // Custom views
  createCustomView: (data: {
    boardId: string;
    name: string;
    viewType: string;
    config: Record<string, unknown>;
    description?: string;
  }): Promise<ApiResponse<unknown>> =>
    apiRequest('/customization/views', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCustomViews: (boardId: string): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    viewType: string;
    config: Record<string, unknown>;
    isDefault?: boolean;
  }>>> =>
    apiRequest(`/customization/views/board/${boardId}`),
  updateCustomView: (viewId: string, updates: Record<string, unknown>): Promise<ApiResponse<unknown>> =>
    apiRequest(`/customization/views/${viewId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteCustomView: (viewId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/customization/views/${viewId}`, {
      method: 'DELETE',
    }),

  // Preferences
  getPreferences: (): Promise<ApiResponse<{
    uiPreferences: {
      theme: string;
      sidebarCollapsed: boolean;
      density: string;
      fontSize: string;
      showAvatars: boolean;
      showTimestamps: boolean;
    };
    notificationPreferences: {
      emailNotifications: boolean;
      pushNotifications: boolean;
      itemUpdates: boolean;
      comments: boolean;
      mentions: boolean;
      approvals: boolean;
      dueDates: boolean;
      weeklyDigest: boolean;
    };
    boardPreferences: {
      defaultView: string;
      showCompletedItems: boolean;
      autoSave: boolean;
    };
  }>> =>
    apiRequest('/customization/preferences'),
  updatePreferences: (preferences: Record<string, unknown>): Promise<ApiResponse<unknown>> =>
    apiRequest('/customization/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),
};

export const notificationAPI = {
  // Get notifications
  getNotifications: (options?: { unreadOnly?: boolean; limit?: number; offset?: number }): Promise<ApiResponse<Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: string;
    metadata?: Record<string, unknown>;
  }>>> => {
    const params = new URLSearchParams();
    if (options?.unreadOnly) params.append('unreadOnly', 'true');
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    return apiRequest(`/notifications${params.toString() ? '?' + params.toString() : ''}`);
  },

  // Get unread count
  getUnreadCount: (): Promise<ApiResponse<{ count: number }>> =>
    apiRequest('/notifications/unread-count'),

  // Mark as read
  markAsRead: (notificationId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    }),

  // Mark all as read
  markAllAsRead: (): Promise<ApiResponse<{ message: string }>> =>
    apiRequest('/notifications/read-all', {
      method: 'PUT',
    }),

  // Delete notification
  deleteNotification: (notificationId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/notifications/${notificationId}`, {
      method: 'DELETE',
    }),
};

export const reportAPI = {
  // Create report
  createReport: (data: {
    workspaceId?: string;
    boardId?: string;
    name: string;
    type: 'invoice_summary' | 'approval_status' | 'payment_status' | 'aging' | 'custom';
    config: {
      columns?: string[];
      filters?: Record<string, unknown>;
      grouping?: unknown;
      sorting?: unknown;
    };
    schedule?: unknown;
    isActive?: boolean;
  }): Promise<ApiResponse<unknown>> =>
    apiRequest('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get workspace reports
  getWorkspaceReports: (workspaceId: string): Promise<ApiResponse<unknown[]>> =>
    apiRequest(`/reports/workspace/${workspaceId}`),

  // Get report by ID
  getReportById: (reportId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/reports/${reportId}`),

  // Update report
  updateReport: (reportId: string, data: {
    name?: string;
    config?: unknown;
    schedule?: unknown;
    isActive?: boolean;
  }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete report
  deleteReport: (reportId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/reports/${reportId}`, {
      method: 'DELETE',
    }),

  // Generate report
  generateReport: (data: {
    type: 'invoice_summary' | 'approval_status' | 'payment_status' | 'aging' | 'custom';
    boardId?: string;
    workspaceId?: string;
    config: unknown;
  }): Promise<ApiResponse<{
    columns: string[];
    rows: Array<Record<string, unknown>>;
    summary?: unknown;
    metadata: unknown;
  }>> =>
    apiRequest('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const approvalAPI = {
  // Request approval for an item
  requestApproval: (itemId: string, data?: { levels?: string[] }): Promise<ApiResponse<unknown[]>> =>
    apiRequest(`/approvals/item/${itemId}/request`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),
  
  // Get approvals for an item
  getItemApprovals: (itemId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/approvals/item/${itemId}`),
  
  // Get my pending approvals
  getMyPendingApprovals: (): Promise<ApiResponse<unknown[]>> =>
    apiRequest('/approvals/pending'),
  
  // Create approval
  createApproval: (data: { itemId: string; level: string; approverId?: string }): Promise<ApiResponse<unknown>> =>
    apiRequest('/approvals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Get approval by ID
  getApprovalById: (approvalId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/approvals/${approvalId}`),
  
  // Update approval (approve/reject)
  updateApproval: (approvalId: string, data: { status: string; comments?: string; approverId?: string }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/approvals/${approvalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Delete approval
  deleteApproval: (approvalId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/approvals/${approvalId}`, {
      method: 'DELETE',
    }),
};
