import { APP_CONFIG } from './config';

// Department options for signup and user management
export const DEPARTMENTS = APP_CONFIG.BUSINESS.DEPARTMENTS.map(dept => ({
  value: dept,
  label: dept === 'HR' ? 'Human Resources' : dept === 'IT' ? 'Information Technology' : dept
})) as const;

// User roles
export const USER_ROLES = APP_CONFIG.BUSINESS.USER_ROLES.map(role => ({
  value: role,
  label: role === 'employee' ? 'Employee' : role === 'manager' ? 'Manager' : 'Administrator'
})) as const;

// Leave types
export const LEAVE_TYPES = APP_CONFIG.BUSINESS.LEAVE_TYPES.map(type => ({
  value: type,
  label: type === 'annual' ? 'Annual Leave' : 
         type === 'sick' ? 'Sick Leave' :
         type === 'casual' ? 'Casual Leave' :
         type === 'maternity' ? 'Maternity Leave' :
         type === 'paternity' ? 'Paternity Leave' :
         type === 'emergency' ? 'Emergency Leave' : type
})) as const;

// Leave statuses
export const LEAVE_STATUSES = APP_CONFIG.BUSINESS.LEAVE_STATUSES.map(status => ({
  value: status,
  label: status === 'pending' ? 'Pending' :
         status === 'approved' ? 'Approved' :
         status === 'rejected' ? 'Rejected' :
         status === 'escalated' ? 'Escalated' : status
})) as const;

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: APP_CONFIG.SECURITY.PASSWORD.MIN_LENGTH,
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

