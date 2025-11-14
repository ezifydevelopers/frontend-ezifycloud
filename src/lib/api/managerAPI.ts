// Manager API endpoints
import { apiRequest } from './base';
import {
  ApiResponse,
  DashboardStatsParams,
  ManagerDashboardStats,
  QuickStats,
  RecentActivity,
  TeamStats,
  TeamMemberParams,
  AddTeamMemberRequest,
  UpdateTeamMemberRequest,
  TeamMemberPerformance,
  LeaveApprovalParams,
  ProcessApprovalActionRequest,
  BulkProcessApprovalActionRequest,
  ApprovalStats,
  UrgentApproval,
  ApprovalHistoryParams,
  LeavePolicyParams,
  CreateLeaveRequest,
  UpdateLeaveRequest,
  LeaveRequestParams,
  LeaveHistoryParams,
  UpdateProfileRequest,
  UpcomingHoliday,
  MonthlySalary,
  SalaryCalculation,
  SalaryStatistics,
  PaginatedResponse,
} from '../../types/api';
import { LeaveRequest, LeaveBalance, LeavePolicy } from '../../types/leave';
import { User } from '../../types/auth';
import { DepartmentStats } from '../../types/api';

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
  
  getTeamMemberEditHistory: (id: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<unknown>>> =>
    apiRequest(`/manager/team/members/${id}/edit-history${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  
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
  
  getTeamMonthlyLeaveStats: (params?: { department?: string; year?: number }): Promise<ApiResponse<Array<{
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
    apiRequest(`/manager/team/monthly-leave-stats${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  
  getTeamDepartments: (): Promise<ApiResponse<string[]>> => apiRequest('/manager/team/departments'),
  
  getTeamMemberPerformance: (id: string): Promise<ApiResponse<TeamMemberPerformance>> => apiRequest(`/manager/team/members/${id}/performance`),
  
  getTeamMemberRecentLeaves: (id: string, limit?: number): Promise<ApiResponse<LeaveRequest[]>> => 
    apiRequest(`/manager/team/members/${id}/recent-leaves${limit ? `?limit=${limit}` : ''}`),
  
  getTeamMemberLeaveBalance: (id: string): Promise<ApiResponse<LeaveBalance>> => 
    apiRequest(`/manager/team/members/${id}/leave-balance`),

  // User Approvals
  getPendingUserApprovals: (params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<User>>> => 
    apiRequest(`/manager/team/pending-approvals${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),

  approveUserAccess: (userId: string): Promise<ApiResponse<User>> =>
    apiRequest(`/manager/team/users/${userId}/approve`, {
      method: 'POST',
    }),

  rejectUserAccess: (userId: string, reason?: string): Promise<ApiResponse<User>> =>
    apiRequest(`/manager/team/users/${userId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  
  adjustTeamMemberLeaveBalance: (id: string, data: { leaveType: string; additionalDays: number; reason: string }, year?: string): Promise<ApiResponse<Record<string, unknown>>> =>
    apiRequest(`/manager/team/members/${id}/leave-balance/adjust${year ? `?year=${year}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Team Performance & Capacity
  getTeamPerformanceMetrics: (): Promise<ApiResponse<{
    teamPerformance: {
      averageProductivity: number;
      totalProjects: number;
      completedProjects: number;
      onTimeDelivery: number;
    };
    memberPerformance: Array<{
      userId: string;
      userName: string;
      productivity: number;
      completedTasks: number;
      onTimeTasks: number;
    }>;
  }>> => 
    apiRequest('/manager/team/performance'),
  
  getTeamCapacityMetrics: (): Promise<ApiResponse<{
    totalCapacity: number;
    currentUtilization: number;
    availableCapacity: number;
    byDepartment: Record<string, { capacity: number; utilization: number }>;
  }>> => 
    apiRequest('/manager/team/capacity'),
  
  // Leave Approvals
  getLeaveApprovals: (params?: LeaveApprovalParams): Promise<ApiResponse<PaginatedResponse<LeaveRequest>>> => {
    if (!params) {
      return apiRequest(`/manager/approvals`);
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
    return apiRequest(`/manager/approvals${queryString}`);
  },
  
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
  
  getLeaveRequests: (params?: LeaveRequestParams): Promise<ApiResponse<PaginatedResponse<LeaveRequest>>> => {
    if (!params) {
      return apiRequest(`/manager/leave-requests`);
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
    return apiRequest(`/manager/leave-requests${queryString}`);
  },
  
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
  getTeamSalaries: (): Promise<ApiResponse<unknown[]>> => apiRequest('/manager/salaries/team'),
  
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

  resetTeamMemberPassword: (memberId: string, newPassword: string): Promise<ApiResponse<{ memberId: string; email: string; name: string }>> =>
    apiRequest(`/manager/team/members/${memberId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),
};

