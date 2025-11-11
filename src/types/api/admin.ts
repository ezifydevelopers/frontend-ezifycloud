// Admin API types

import { UserRole } from '../auth';
import { LeaveType } from '../leave';

export interface DashboardStatsParams {
  startDate?: string;
  endDate?: string;
  department?: string;
  period?: 'week' | 'month' | 'quarter' | 'year';
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  totalLeaveDays: number;
  averageLeaveDays: number;
  departmentBreakdown: DepartmentStats[];
}

export interface DepartmentStats {
  department: string;
  employeeCount: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  totalLeaveDays: number;
}

export interface QuickStats {
  totalEmployees: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

export interface RecentActivity {
  id: string;
  type: 'leave_request' | 'user_action' | 'system_event';
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: Date;
  type: 'national' | 'company' | 'religious' | 'public';
  description?: string;
  isRecurring: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateHolidayRequest {
  name: string;
  date: Date;
  type: 'national' | 'company' | 'religious' | 'public';
  description?: string;
  isRecurring: boolean;
}

export interface UpdateHolidayRequest {
  name?: string;
  date?: Date;
  type?: 'national' | 'company' | 'religious' | 'public';
  description?: string;
  isRecurring?: boolean;
  isActive?: boolean;
}

export interface HolidayStats {
  totalHolidays: number;
  activeHolidays: number;
  inactiveHolidays: number;
  byType: Record<string, number>;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  timezone: string;
  workingDays: number[];
  workingHours: {
    start: string;
    end: string;
  };
}

export interface UpdateCompanyInfoRequest {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  timezone?: string;
  workingDays?: number[];
  workingHours?: {
    start: string;
    end: string;
  };
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  targetType?: 'leave_request' | 'user' | 'policy';
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReportParams {
  startDate?: string;
  endDate?: string;
  department?: string;
  employeeId?: string;
  leaveType?: LeaveType;
  status?: string;
  format?: 'json' | 'csv' | 'pdf';
}

export interface LeaveReport {
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  totalDays: number;
  averageDays: number;
  byLeaveType: Record<LeaveType, number>;
  byDepartment: Record<string, number>;
  byMonth: Record<string, number>;
}

export interface EmployeeReport {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  byDepartment: Record<string, number>;
  byRole: Record<UserRole, number>;
  averageTenure: number;
  newHires: number;
  departures: number;
}

export interface DepartmentReport {
  departments: Array<{
    name: string;
    employeeCount: number;
    totalLeaves: number;
    averageLeaves: number;
    pendingLeaves: number;
  }>;
  totalDepartments: number;
  totalEmployees: number;
  totalLeaves: number;
}

