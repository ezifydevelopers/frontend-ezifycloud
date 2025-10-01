export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'escalated';
export type LeaveType = 'annual' | 'sick' | 'casual' | 'maternity' | 'paternity' | 'emergency';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  submittedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  documents?: string[];
  isHalfDay?: boolean;
  comments?: string;
}

export interface LeaveBalance {
  userId: string;
  annual: {
    total: number;
    used: number;
    remaining: number;
  };
  sick: {
    total: number;
    used: number;
    remaining: number;
  };
  casual: {
    total: number;
    used: number;
    remaining: number;
  };
  year: number;
}

export interface LeavePolicy {
  id: string;
  leaveType: LeaveType;
  totalDaysPerYear: number;
  canCarryForward: boolean;
  maxCarryForwardDays?: number;
  requiresApproval: boolean;
  allowHalfDay: boolean;
  description: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  targetId: string;
  targetType: 'leave_request' | 'user' | 'policy';
  details: string;
  timestamp: Date;
}