import { User, UserRole } from './auth';
import { LeaveRequest, LeaveBalance, LeavePolicy, LeaveType, LeaveStatus, AuditLog } from './leave';

// Common API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth API types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  department?: string;
  role?: UserRole;
  manager_id?: string | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// User API types

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  department?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface ToggleUserStatusRequest {
  isActive: boolean;
}

// Leave API types
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

// Admin API types
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

export interface EmployeeParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  managerId?: string;
  phone?: string;
  bio?: string;
}

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  department?: string;
  managerId?: string;
  salary?: number;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  avatar?: string;
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

export interface ReportParams {
  startDate?: string;
  endDate?: string;
  department?: string;
  employeeId?: string;
  leaveType?: LeaveType;
  status?: LeaveStatus;
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

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  leaveRequestNotifications: boolean;
  approvalNotifications: boolean;
  reminderNotifications: boolean;
  weeklyDigest: boolean;
  monthlyReport: boolean;
}

export interface UpdateNotificationSettingsRequest {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  leaveRequestNotifications?: boolean;
  approvalNotifications?: boolean;
  reminderNotifications?: boolean;
  weeklyDigest?: boolean;
  monthlyReport?: boolean;
}

export interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // days
  };
  sessionTimeout: number; // minutes
  twoFactorAuth: boolean;
  ipWhitelist: string[];
  loginAttempts: number;
  lockoutDuration: number; // minutes
}

export interface UpdateSecuritySettingsRequest {
  passwordPolicy?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
    maxAge?: number;
  };
  sessionTimeout?: number;
  twoFactorAuth?: boolean;
  ipWhitelist?: string[];
  loginAttempts?: number;
  lockoutDuration?: number;
}

// Manager API types
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

// Attendance Types
export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  department: string;
  position: string;
  avatar?: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  hoursWorked: number;
  overtimeHours: number;
  notes?: string;
  isHoliday: boolean;
  isWeekend: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStats {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  halfDayCount: number;
  onLeaveCount: number;
  attendanceRate: number;
  totalHoursWorked: number;
  totalOvertimeHours: number;
  averageHoursPerDay: number;
}

export interface CreateAttendanceRecordRequest {
  userId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  hoursWorked: number;
  overtimeHours: number;
  notes?: string;
  isHoliday: boolean;
  isWeekend: boolean;
}

export interface UpdateAttendanceRecordRequest {
  checkInTime?: string;
  checkOutTime?: string;
  status?: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  hoursWorked?: number;
  overtimeHours?: number;
  notes?: string;
}

export interface LeaveApprovalParams {
  page?: number;
  limit?: number;
  status?: LeaveStatus;
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

// Employee API types
export interface EmployeeDashboardStats {
  leaveBalance: LeaveBalance;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalLeaveDays: number;
  upcomingHolidays: number;
  teamSize: number;
  performanceScore: number;
}

export interface PersonalInfo {
  id: string;
  name: string;
  email: string;
  department: string;
  managerName?: string;
  hireDate: string;
  employeeId: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface LeaveBalanceParams {
  year?: number;
  includeUsed?: boolean;
}

export interface UpcomingHoliday {
  id: string;
  name: string;
  date: string;
  type: 'national' | 'company' | 'department';
  description?: string;
}

export interface TeamInfo {
  teamName: string;
  teamSize: number;
  managerName: string;
  department: string;
  teamMembers: Array<{
    id: string;
    name: string;
    role: string;
    isActive: boolean;
  }>;
}

export interface PerformanceMetrics {
  overall: number;
  attendance: number;
  productivity: number;
  teamwork: number;
  communication: number;
  lastReviewDate: string;
  nextReviewDate: string;
  goals: PerformanceGoal[];
  achievements: Achievement[];
}

export interface PerformanceGoal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'award' | 'certification' | 'milestone';
  date: string;
  issuer: string;
  badge?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
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

export interface CalendarParams {
  startDate: string;
  endDate: string;
  eventType?: 'leave' | 'holiday' | 'meeting' | 'event' | 'all';
  leaveType?: string;
  status?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'leave' | 'holiday' | 'meeting' | 'event';
  startDate: string;
  endDate: string;
  allDay: boolean;
  leaveType?: string;
  status?: 'pending' | 'approved' | 'rejected';
  color?: string;
  description?: string;
  location?: string;
}

export interface CalendarResponse {
  events: CalendarEvent[];
  holidays: Holiday[];
  filters: CalendarParams;
  monthStats: MonthStats;
}

export interface MonthStats {
  totalDays: number;
  workingDays: number;
  holidays: number;
  leaveDays: number;
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

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  bio?: string;
  address?: string;
  emergencyContact?: string;
}

export interface UpdateAvatarRequest {
  avatar: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  leaveRequestNotifications: boolean;
  approvalNotifications: boolean;
  reminderNotifications: boolean;
  weeklyDigest: boolean;
  monthlyReport: boolean;
  notificationFrequency: 'immediate' | 'daily' | 'weekly';
}

export interface UpdateNotificationPreferencesRequest {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  leaveRequestNotifications?: boolean;
  approvalNotifications?: boolean;
  reminderNotifications?: boolean;
  weeklyDigest?: boolean;
  monthlyReport?: boolean;
  notificationFrequency?: 'immediate' | 'daily' | 'weekly';
}

export interface CalendarPreferences {
  defaultView: 'month' | 'week' | 'day';
  startOfWeek: 'sunday' | 'monday';
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: number[];
  showWeekends: boolean;
  showHolidays: boolean;
  timezone: string;
}

export interface UpdateCalendarPreferencesRequest {
  defaultView?: 'month' | 'week' | 'day';
  startOfWeek?: 'sunday' | 'monday';
  workingHours?: {
    start: string;
    end: string;
  };
  workingDays?: number[];
  showWeekends?: boolean;
  showHolidays?: boolean;
  timezone?: string;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'team' | 'private';
  leaveHistoryVisibility: 'public' | 'team' | 'private';
  contactInfoVisibility: 'public' | 'team' | 'private';
  allowDirectMessages: boolean;
  showOnlineStatus: boolean;
  showLastActive: boolean;
}

export interface UpdatePrivacySettingsRequest {
  profileVisibility?: 'public' | 'team' | 'private';
  leaveHistoryVisibility?: 'public' | 'team' | 'private';
  contactInfoVisibility?: 'public' | 'team' | 'private';
  allowDirectMessages?: boolean;
  showOnlineStatus?: boolean;
  showLastActive?: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
  passwordChangeNotifications: boolean;
  deviceManagement: boolean;
}

export interface PerformanceGoal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  goalStatus: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  achievementType: 'performance' | 'attendance' | 'teamwork' | 'innovation';
  earnedAt: string;
  points: number;
  badge?: string;
}

// Security Settings Types
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotificationsEnabled: boolean;
  passwordChangeRequired: boolean;
  sessionTimeoutMinutes: number;
  passwordLastChanged: string;
  loginHistory: LoginHistory[];
  activeSessions: ActiveSession[];
  securityQuestions: SecurityQuestion[];
}

export interface LoginHistory {
  id: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  success: boolean;
}

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface SecurityQuestion {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
}

export interface UpdateSecuritySettingsRequest {
  twoFactorEnabled?: boolean;
  loginNotificationsEnabled?: boolean;
  passwordChangeRequired?: boolean;
  sessionTimeoutMinutes?: number;
}

// App Preferences Types
export interface AppPreferences {
  theme: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  weekStartsOn: string;
}

export interface UpdateAppPreferencesRequest {
  theme?: string;
  language?: string;
  dateFormat?: string;
  timeFormat?: string;
  weekStartsOn?: string;
}

// Salary Management Types
export interface EmployeeSalary {
  id: string;
  userId: string;
  baseSalary: number;
  hourlyRate?: number;
  currency: string;
  effectiveDate: string;
  endDate?: string;
  isActive: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    department?: string;
  };
}

export interface SalaryDeduction {
  id: string;
  type: 'leave_deduction' | 'tax_deduction' | 'other_deduction' | 'bonus' | 'overtime';
  description: string;
  amount: number;
  leaveRequestId?: string;
  isTaxable: boolean;
  createdAt: string;
}

export interface MonthlySalary {
  id: string;
  userId: string;
  year: number;
  month: number;
  baseSalary: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: 'draft' | 'calculated' | 'approved' | 'paid' | 'cancelled';
  calculatedAt?: string;
  approvedAt?: string;
  paidAt?: string;
  approvedBy?: string;
  notes?: string;
  user: {
    id: string;
    name: string;
    email: string;
    department?: string;
  };
  deductions: SalaryDeduction[];
}

export interface SalaryCalculation {
  baseSalary: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  deductions: {
    leaveDeductions: number;
    taxDeductions: number;
    otherDeductions: number;
    bonuses: number;
    overtime: number;
  };
  leaveRequests: Array<{
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    deductionAmount: number;
  }>;
}

export interface SalaryStatistics {
  totalEmployees: number;
  totalGrossSalary: number;
  totalDeductions: number;
  totalNetSalary: number;
  averageSalary: number;
  leaveDeductions: number;
  taxDeductions: number;
}
