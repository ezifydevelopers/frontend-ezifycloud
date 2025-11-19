export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'escalated' | 'all';
export type LeaveType = 'annual' | 'sick' | 'casual' | 'maternity' | 'paternity' | 'emergency';

export interface LeaveRequest {
  id: string;
  employee: {
    id: string;
    name: string;
    email: string;
    employeeId?: string;
    department: string;
    avatar?: string;
    employeeType?: 'onshore' | 'offshore' | null;
  };
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  isPaid?: boolean;
  submittedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  documents?: string[];
  isHalfDay?: boolean;
  comments?: string;
  priority?: 'low' | 'medium' | 'high';
  emergencyContact?: string;
  workHandover?: string;
  halfDayPeriod?: 'morning' | 'afternoon';
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
  name?: string;
  description?: string;
  leaveType: LeaveType;
  maxDaysPerYear?: number;
  totalDaysPerYear?: number; // Alternative field name
  maxDaysPerRequest?: number;
  carryForwardDays?: number;
  carryForwardExpiry?: number; // months
  isPaid?: boolean; // camelCase from Prisma
  is_paid?: boolean; // snake_case from API (if not transformed)
  requiresApproval?: boolean;
  requiresDocumentation?: boolean;
  isActive?: boolean;
  applicableRoles?: string[];
  applicableDepartments?: string[];
  createdAt?: string;
  updatedAt?: string;
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