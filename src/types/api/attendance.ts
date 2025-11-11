// Attendance API types

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

