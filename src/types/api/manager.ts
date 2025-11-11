// Manager API types

import { LeaveType } from '../leave';

export interface ManagerDashboardStats {
  teamSize: number;
  activeTeamMembers: number;
  pendingApprovals: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  teamLeaveBalance: TeamLeaveBalance;
  upcomingLeaves: UpcomingLeave[];
  recentActivities: ManagerActivity[];
  teamPerformance: TeamPerformanceMetrics;
  departmentStats: ManagerDepartmentStats[];
}

export interface TeamLeaveBalance {
  totalAnnual: number;
  usedAnnual: number;
  remainingAnnual: number;
  totalSick: number;
  usedSick: number;
  remainingSick: number;
  totalCasual: number;
  usedCasual: number;
  remainingCasual: number;
  utilizationRate: number;
}

export interface UpcomingLeave {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  submittedAt: Date;
  avatar?: string;
}

export interface ManagerActivity {
  id: string;
  type: 'leave_approval' | 'leave_rejection' | 'team_member_join' | 'team_member_update' | 'leave_request';
  title: string;
  description: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface TeamPerformanceMetrics {
  averageResponseTime: number;
  approvalRate: number;
  teamSatisfaction: number;
  productivityScore: number;
  leaveUtilization: number;
}

export interface ManagerDepartmentStats {
  department: string;
  totalMembers: number;
  activeMembers: number;
  onLeave: number;
  leaveRequests: number;
  averageResponseTime: number;
  approvalRate: number;
}

export interface TeamMemberParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  status?: 'active' | 'inactive' | 'all';
  role?: 'manager' | 'employee';
  performance?: 'high' | 'medium' | 'low' | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AddTeamMemberRequest {
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  position: string;
  salary: number;
  startDate: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  skills?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateTeamMemberRequest {
  name?: string;
  email?: string;
  department?: string;
  password?: string;
  isActive?: boolean;
}

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  onLeave: number;
  averagePerformance: number;
  leaveUtilization: number;
  byDepartment: { [key: string]: number };
  byRole: { [key: string]: number };
}

export interface BackendTeamMember {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  role: 'manager' | 'employee';
  managerId?: string;
  managerName?: string;
  isActive: boolean;
  joinDate: Date;
  lastLogin?: Date;
  leaveBalance: {
    annual: number;
    sick: number;
    casual: number;
    emergency: number;
  };
  avatar?: string;
  bio?: string;
  skills?: string[];
  performance: {
    overall: number;
    attendance: number;
    productivity: number;
    teamwork: number;
    communication: number;
    lastReviewDate: Date;
    nextReviewDate: Date;
  };
  recentLeaves: Array<{
    id: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
    days: number;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMemberPerformance {
  id: string;
  name: string;
  totalLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  averageResponseTime: number;
  punctuality: number;
  overallRating: number;
}

export interface TeamCapacityData {
  totalMembers: number;
  activeMembers: number;
  onLeave: number;
  available: number;
  utilizationRate: number;
  capacityScore: number;
}

export interface LeaveApprovalParams {
  page?: number;
  limit?: number;
  status?: string;
  employeeId?: string;
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProcessApprovalActionRequest {
  requestId: string;
  action: 'approve' | 'reject';
  comments?: string;
}

export interface BulkProcessApprovalActionRequest {
  requestIds: string[];
  action: 'approve' | 'reject';
  comments?: string;
}

export interface ApprovalStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  averageProcessingTime: number;
  approvalRate: number;
  byLeaveType: Record<LeaveType, number>;
  byPriority: Record<string, number>;
  byEmployee: Array<{
    employeeId: string;
    employeeName: string;
    requestCount: number;
  }>;
}

export interface UrgentApproval {
  id: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  submittedAt: string;
}

export interface ApprovalHistoryParams {
  page?: number;
  limit?: number;
  employeeId?: string;
  action?: 'approve' | 'reject';
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

