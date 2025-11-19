// Admin API endpoints
import { apiRequest, getApiBaseUrl } from './base';
import {
  ApiResponse,
  DashboardStatsParams,
  DashboardStats,
  QuickStats,
  RecentActivity,
  EmployeeParams,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  LeaveRequestParams,
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
  Holiday,
  CreateHolidayRequest,
  UpdateHolidayRequest,
  HolidayStats,
  EmployeeSalary,
  MonthlySalary,
  SalaryCalculation,
  SalaryStatistics,
  PaginatedResponse,
} from '../../types/api';
import { LeaveRequest, LeaveBalance, LeavePolicy, AuditLog } from '../../types/leave';
import { User } from '../../types/auth';

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
  
  getEmployeeEditHistory: (id: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<AuditLog>>> =>
    apiRequest(`/admin/employees/${id}/edit-history${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),

  getPaidUnpaidLeaveStats: (params?: { department?: string; year?: number; employeeId?: string }): Promise<ApiResponse<Array<{
    employeeId: string;
    employeeName: string;
    employeeEmail: string;
    department: string | null;
    totalPaidDays: number;
    totalUnpaidDays: number;
    totalDays: number;
    byLeaveType: Array<{
      leaveType: string;
      paidDays: number;
      unpaidDays: number;
      totalDays: number;
    }>;
    leaveRequests: Array<{
      id: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      totalDays: number;
      isPaid: boolean;
      status: string;
      submittedAt: string;
    }>;
  }>>> =>
    apiRequest(`/admin/employees/paid-unpaid-leaves${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),

  getMonthlyPaidUnpaidLeaveStats: (params?: { department?: string; year?: number; employeeId?: string }): Promise<ApiResponse<Array<{
    employeeId: string;
    employeeName: string;
    employeeEmail: string;
    department: string | null;
    monthlyStats: Array<{
      month: number;
      monthName: string;
      paidDays: number;
      unpaidDays: number;
      totalDays: number;
    }>;
    yearlyTotal: {
      paidDays: number;
      unpaidDays: number;
      totalDays: number;
    };
  }>>> =>
    apiRequest(`/admin/employees/monthly-paid-unpaid-leaves${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  
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
  
  permanentlyDeleteEmployee: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/admin/employees/${id}/permanent`, {
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
  
  exportEmployeesToCSV: (): Promise<Blob> => {
    const API_BASE_URL = getApiBaseUrl();
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE_URL}/admin/employees/export`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }).then(response => {
      if (!response.ok) {
        throw new Error('Failed to export employees');
      }
      return response.blob();
    });
  },
  
  getEmployeeLeaveBalance: (id: string): Promise<ApiResponse<LeaveBalance>> => 
    apiRequest(`/admin/employees/${id}/leave-balance`),
  
  getUserLeaveBalance: (id: string, year?: string): Promise<ApiResponse<Record<string, unknown>>> => 
    apiRequest(`/admin/employees/${id}/leave-balance${year ? `?year=${year}` : ''}`),
  
  adjustEmployeeLeaveBalance: (id: string, data: { leaveType: string; additionalDays: number; reason: string }, year?: string): Promise<ApiResponse<Record<string, unknown>>> =>
    apiRequest(`/admin/employees/${id}/leave-balance/adjust${year ? `?year=${year}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Leave Requests
  getLeaveRequests: (params?: LeaveRequestParams): Promise<ApiResponse<PaginatedResponse<LeaveRequest>>> => {
    if (!params) {
      return apiRequest(`/admin/leave-requests`);
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
    return apiRequest(`/admin/leave-requests${queryString}`);
  },
  
  getLeaveRequestById: (id: string): Promise<ApiResponse<LeaveRequest>> => apiRequest(`/admin/leave-requests/${id}`),
  
  updateLeaveRequestStatus: (id: string, status: string, comments?: string): Promise<ApiResponse<LeaveRequest>> =>
    apiRequest(`/admin/leave-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comments }),
    }),
  
  // Update paid/unpaid status of an approved leave request
  updateLeaveRequestPaidStatus: (id: string, isPaid: boolean, comments?: string): Promise<ApiResponse<LeaveRequest>> =>
    apiRequest(`/admin/leave-requests/${id}/paid-status`, {
      method: 'PATCH',
      body: JSON.stringify({ isPaid, comments }),
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

  getSystemConfig: (): Promise<ApiResponse<{ defaultProbationDuration?: number; [key: string]: any }>> =>
    apiRequest('/admin/settings/system-config'),

  updateSystemConfig: (configData: { defaultProbationDuration?: number; [key: string]: any }): Promise<ApiResponse<any>> =>
    apiRequest('/admin/settings/system-config', {
      method: 'PUT',
      body: JSON.stringify(configData),
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
  getAttendanceRecords: (params?: string): Promise<ApiResponse<unknown[]>> => 
    apiRequest(`/admin/attendance${params ? '?' + params : ''}`),
  
  getAttendanceStats: (): Promise<ApiResponse<unknown>> => 
    apiRequest('/admin/attendance/stats'),
  
  getAttendanceRecordById: (id: string): Promise<ApiResponse<unknown>> => 
    apiRequest(`/admin/attendance/${id}`),
  
  createAttendanceRecord: (recordData: { userId: string; date: string; checkIn?: string; checkOut?: string; status?: string }): Promise<ApiResponse<unknown>> =>
    apiRequest('/admin/attendance', {
      method: 'POST',
      body: JSON.stringify(recordData),
    }),
  
  updateAttendanceRecord: (id: string, recordData: { date?: string; checkIn?: string; checkOut?: string; status?: string }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/admin/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    }),
  
  deleteAttendanceRecord: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/admin/attendance/${id}`, {
      method: 'DELETE',
    }),
  
  getUserAttendanceRecords: (userId: string, params?: string): Promise<ApiResponse<unknown[]>> => 
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
  
  createEmployeeSalary: (salaryData: unknown): Promise<ApiResponse<EmployeeSalary>> =>
    apiRequest('/admin/salaries/employees', {
      method: 'POST',
      body: JSON.stringify(salaryData),
    }),
  
  updateEmployeeSalary: (salaryId: string, salaryData: unknown): Promise<ApiResponse<EmployeeSalary>> =>
    apiRequest(`/admin/salaries/employees/${salaryId}`, {
      method: 'PUT',
      body: JSON.stringify(salaryData),
    }),

  // User Approvals
  getPendingApprovals: (params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const queryParams = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return apiRequest(`/admin/users/pending-approvals${queryParams ? `?${queryParams}` : ''}`);
  },

  approveUserAccess: (userId: string): Promise<ApiResponse<User>> =>
    apiRequest(`/admin/users/${userId}/approve`, {
      method: 'POST',
    }),

  rejectUserAccess: (userId: string, reason?: string): Promise<ApiResponse<User>> =>
    apiRequest(`/admin/users/${userId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Probation Management
  completeProbation: (employeeId: string): Promise<ApiResponse<User>> =>
    apiRequest(`/admin/employees/${employeeId}/probation/complete`, {
      method: 'POST',
    }),

  extendProbation: (employeeId: string, additionalDays: number): Promise<ApiResponse<User>> =>
    apiRequest(`/admin/employees/${employeeId}/probation/extend`, {
      method: 'POST',
      body: JSON.stringify({ additionalDays }),
    }),

  terminateProbation: (employeeId: string): Promise<ApiResponse<User>> =>
    apiRequest(`/admin/employees/${employeeId}/probation/terminate`, {
      method: 'POST',
    }),

  updateProbation: (
    employeeId: string,
    data: {
      probationStartDate?: string;
      probationEndDate?: string;
      probationDuration?: number;
    }
  ): Promise<ApiResponse<User>> =>
    apiRequest(`/admin/employees/${employeeId}/probation`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getProbationEndingSoon: (days?: number): Promise<ApiResponse<User[]>> =>
    apiRequest(`/admin/employees/probation/ending-soon${days ? `?days=${days}` : ''}`),

  resetEmployeePassword: (employeeId: string, newPassword: string): Promise<ApiResponse<{ employeeId: string; email: string; name: string }>> =>
    apiRequest(`/admin/employees/${employeeId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),
};

