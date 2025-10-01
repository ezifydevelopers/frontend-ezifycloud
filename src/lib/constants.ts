// Department options for signup and user management
export const DEPARTMENTS = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'HR', label: 'Human Resources' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Operations', label: 'Operations' },
  { value: 'IT', label: 'Information Technology' },
  { value: 'Customer Support', label: 'Customer Support' },
] as const;

// User roles
export const USER_ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Administrator' },
] as const;

// Leave types
export const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'emergency', label: 'Emergency Leave' },
] as const;

// Leave statuses
export const LEAVE_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'escalated', label: 'Escalated' },
] as const;

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 6,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/,
  message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  USERS: {
    PROFILE: '/users/profile',
    ALL: '/users',
    BY_ID: (id: string) => `/users/${id}`,
  },
  LEAVES: {
    ALL: '/leaves',
    BY_ID: (id: string) => `/leaves/${id}`,
    STATUS: (id: string) => `/leaves/${id}/status`,
  }
} as const;

