// Leave API types

import { LeaveType, LeaveStatus } from '../leave';

export interface CreateLeaveRequest {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  isHalfDay?: boolean;
  halfDayPeriod?: 'morning' | 'afternoon';
  emergencyContact?: string;
  workHandover?: string;
  attachments?: string[];
}

export interface UpdateLeaveRequest {
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
  reason?: string;
  isHalfDay?: boolean;
  halfDayPeriod?: 'morning' | 'afternoon';
  emergencyContact?: string;
  workHandover?: string;
  attachments?: string[];
}

export interface UpdateLeaveStatusRequest {
  status: LeaveStatus;
  reason?: string;
}

export interface LeaveRequestParams {
  page?: number;
  limit?: number;
  status?: LeaveStatus;
  employeeId?: string;
  department?: string;
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateLeaveRequestStatusRequest {
  status: LeaveStatus;
  comments?: string;
}

export interface BulkUpdateLeaveRequestsRequest {
  requestIds: string[];
  action: 'approve' | 'reject';
  comments?: string;
}

export interface LeavePolicyParams {
  page?: number;
  limit?: number;
  search?: string;
  leaveType?: LeaveType;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateLeavePolicyRequest {
  name: string;
  description?: string;
  leaveType: string;
  maxDaysPerYear: number;
  maxDaysPerRequest: number;
  carryForwardDays?: number;
  carryForwardExpiry?: number;
  requiresApproval?: boolean;
  requiresDocumentation?: boolean;
  isActive?: boolean;
  applicableRoles?: string[];
  applicableDepartments?: string[];
}

export interface UpdateLeavePolicyRequest {
  name?: string;
  description?: string;
  leaveType?: string;
  maxDaysPerYear?: number;
  maxDaysPerRequest?: number;
  carryForwardDays?: number;
  carryForwardExpiry?: number;
  requiresApproval?: boolean;
  requiresDocumentation?: boolean;
  isActive?: boolean;
  applicableRoles?: string[];
  applicableDepartments?: string[];
}

export interface LeaveHistoryParams {
  page?: number;
  limit?: number;
  leaveType?: LeaveType;
  status?: LeaveStatus;
  startDate?: string;
  endDate?: string;
  year?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LeaveHistorySummary {
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  totalDays: number;
  byLeaveType: Record<LeaveType, number>;
  byMonth: Record<string, number>;
  byStatus: Record<LeaveStatus, number>;
}

export interface LeaveBalanceParams {
  year?: number;
  includeUsed?: boolean;
}

