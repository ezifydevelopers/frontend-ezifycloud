// Centralized configuration for the application
// This file contains all configurable values that were previously hardcoded

export const APP_CONFIG = {
  // Application Information
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Ezify Cloud',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:9001/api',
  
  // UI Configuration
  UI: {
    // Toast durations (in milliseconds)
    TOAST_DURATION: {
      SHORT: 3000,
      MEDIUM: 5000,
      LONG: 8000,
    },
    
    // Auto-refresh intervals (in milliseconds)
    AUTO_REFRESH: {
      DASHBOARD: 300000, // 5 minutes
      NOTIFICATIONS: 30000, // 30 seconds
    },
    
    // Form validation
    VALIDATION: {
      PASSWORD_MIN_LENGTH: 6,
      NAME_MIN_LENGTH: 2,
    },
    
    // Pagination
    PAGINATION: {
      DEFAULT_PAGE_SIZE: 10,
      MAX_PAGE_SIZE: 100,
    },
  },
  
  // Business Logic Configuration
  BUSINESS: {
    // Default departments
    DEPARTMENTS: [
      'Engineering',
      'Human Resources',
      'Marketing',
      'Sales',
      'Finance',
      'Operations',
      'Customer Support',
      'IT',
    ],
    
    // User roles
    USER_ROLES: [
      'employee',
      'manager',
      'admin',
    ],
    
    // Leave types
    LEAVE_TYPES: [
      'annual',
      'sick',
      'casual',
      'maternity',
      'paternity',
      'emergency',
    ],
    
    // Leave statuses
    LEAVE_STATUSES: [
      'pending',
      'approved',
      'rejected',
      'escalated',
    ],
    
    // Default values
    DEFAULTS: {
      DEPARTMENT: 'Engineering',
      ROLE: 'employee',
      LEAVE_TYPE: 'annual',
      STATUS: 'pending',
    },
  },
  
  // Form placeholders and labels
  FORMS: {
    PLACEHOLDERS: {
      NAME: 'John Doe',
      EMAIL: 'john@company.com',
      PASSWORD: '••••••••',
      SEARCH_EMPLOYEE: 'Search by employee name or leave type...',
      SEARCH_EMPLOYEES: 'Search employees...',
      CHOOSE_EMPLOYEE: 'Choose an employee',
      SELECT_ROLE: 'Select role',
      SELECT_DEPARTMENT: 'Select department',
      ALL_STATUS: 'All Status',
      ALL_DEPARTMENTS: 'All Departments',
      LEAVE_TYPE: 'Leave Type',
    },
    
    LABELS: {
      FULL_NAME: 'Full Name',
      EMAIL_ADDRESS: 'Email Address',
      PASSWORD: 'Password',
      ROLE: 'Role',
      DEPARTMENT: 'Department',
      ACTIVE_EMPLOYEE: 'Active Employee',
      EMPLOYEE: 'Employee',
      MANAGER: 'Manager',
      ADMIN: 'Administrator',
      HUMAN_RESOURCES: 'Human Resources',
      INFORMATION_TECHNOLOGY: 'Information Technology',
    },
    
    BUTTONS: {
      CANCEL: 'Cancel',
      SAVE: 'Save',
      SAVING: 'Saving...',
      CREATE_EMPLOYEE: 'Create Employee',
      UPDATE_EMPLOYEE: 'Update Employee',
      EDIT_EMPLOYEE: 'Edit Employee',
      ADD_NEW_EMPLOYEE: 'Add New Employee',
      CREATE_HOLIDAY: 'Create Holiday',
      UPDATE_HOLIDAY: 'Update Holiday',
      EDIT_HOLIDAY: 'Edit Holiday',
      ADD_NEW_HOLIDAY: 'Add New Holiday',
      CREATE_POLICY: 'Create Policy',
      UPDATE_POLICY: 'Update Policy',
      EDIT_PROFILE: 'Edit Profile',
      SAVE_PROFILE: 'Save Profile',
    },
  },
  
  // Messages and notifications
  MESSAGES: {
    SUCCESS: {
      EMPLOYEE_CREATED: 'Employee created successfully',
      EMPLOYEE_UPDATED: 'Employee updated successfully',
      PROFILE_UPDATED: 'Profile updated successfully',
      SETTINGS_SAVED: 'Settings saved successfully',
    },
    
    ERROR: {
      PASSWORD_REQUIRED: 'Password is required for new employees',
      PASSWORD_VALIDATION: 'Password must be at least 6 characters with uppercase, lowercase, and number',
      FAILED_TO_SAVE: 'Failed to save employee',
      VALIDATION_FAILED: 'Please check the form for errors',
    },
    
    LOADING: {
      CREATING_EMPLOYEE: 'Creating employee...',
      UPDATING_EMPLOYEE: 'Updating employee...',
      PROCESSING_REQUEST: 'Please wait while we process your request.',
    },
  },
  
  // Salary and financial defaults
  SALARY: {
    PLACEHOLDERS: {
      BASE_SALARY: '50000',
      HOURLY_RATE: '25.00',
      MAX_DAYS_PER_YEAR: '10',
      CARRY_FORWARD_DAYS: '5',
      OVERTIME_RATE: '1.5',
      JOB_LEVEL: 'Senior Level 3',
      BONUS: '500',
      ALLOWANCE: '100',
      DEDUCTION: '1000',
      TAX: '200',
      INSURANCE: '2000',
      RETIREMENT: '500',
      OTHER: '300',
      WORKING_DAYS: '22',
    },
  },
  
  // Dashboard and statistics
  DASHBOARD: {
    TITLES: {
      TOTAL_EMPLOYEES: 'Total Employees',
      ACTIVE_EMPLOYEES: 'Active Employees',
      TOTAL_REQUESTS: 'Total Requests',
      PENDING_REQUESTS: 'Pending Requests',
      APPROVED_REQUESTS: 'Approved Requests',
      DAYS_USED: 'Days Used',
      APPROVAL_RATE: 'Approval Rate',
      TEAM_MEMBERS: 'Team Members',
      TEAM_CAPACITY: 'Team Capacity',
      TOTAL_POLICIES: 'Total Policies',
      ACTIVE_POLICIES: 'Active Policies',
      POLICY_TYPES: 'Policy Types',
      LEAVE_APPROVALS: 'Leave Approvals',
      MANAGER_DASHBOARD: 'Manager Dashboard',
      TEAM_OVERVIEW: 'Team Overview',
      ATTENDANCE_MANAGEMENT: 'Attendance Management',
      LEAVE_REQUESTS: 'Leave Requests',
      EMPLOYEE_MANAGEMENT: 'Employee Management',
    },
    
    DEFAULT_VALUES: {
      MANAGER_NAME: 'Manager Name',
      DEPARTMENT: 'Engineering',
      UNKNOWN_EMPLOYEE: 'Unknown Employee',
      UNKNOWN_POLICY: 'Unknown Policy',
      NO_MANAGER: 'No Manager',
      TEAM_MEMBER: 'Team Member',
    },
  },
  
  // Company information
  COMPANY: {
    DEFAULT_NAME: 'Ezify Cloud',
    DEFAULT_EMAIL: 'info@ezify.com',
    DEFAULT_PHONE: '+1234567890',
    DEFAULT_ADDRESS: '123 Business St, City, State 12345',
    DEFAULT_WEBSITE: 'https://ezifycloud.com',
    DEFAULT_LOGO: 'https://example.com/logo.png',
    DEFAULT_TIMEZONE: 'UTC',
    DEFAULT_DATE_FORMAT: 'YYYY-MM-DD',
  },
  
  // Performance and metrics
  PERFORMANCE: {
    SCALE: {
      MIN: 1,
      MAX: 10,
      DEFAULT: 7.5,
    },
    
    PERCENTAGE: {
      MIN: 0,
      MAX: 100,
    },
  },
  
  // Time and date calculations
  TIME: {
    MILLISECONDS: {
      MINUTE: 60 * 1000,
      HOUR: 60 * 60 * 1000,
      DAY: 24 * 60 * 60 * 1000,
      WEEK: 7 * 24 * 60 * 60 * 1000,
      MONTH: 30 * 24 * 60 * 60 * 1000,
      YEAR: 365 * 24 * 60 * 60 * 1000,
    },
    
    DAYS: {
      REVIEW_PERIOD: 90,
      NOTIFICATION_DAYS: 2,
      ACHIEVEMENT_DAYS: 15,
      PROJECT_DAYS: 30,
      TRAINING_DAYS: 60,
    },
  },
  
  // File and upload limits
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  },
  
  // Security settings
  SECURITY: {
    PASSWORD: {
      MIN_LENGTH: 6,
      REQUIRE_UPPERCASE: true,
      REQUIRE_LOWERCASE: true,
      REQUIRE_NUMBERS: true,
      REQUIRE_SPECIAL_CHARS: false,
    },
    
    SESSION: {
      TIMEOUT: 30 * 60 * 1000, // 30 minutes
    },
  },
} as const;

// Helper functions for common operations
export const getDepartmentLabel = (value: string): string => {
  const department = APP_CONFIG.BUSINESS.DEPARTMENTS.find(dept => dept === value);
  return department || value;
};

export const getRoleLabel = (value: string): string => {
  const roleMap: Record<string, string> = {
    employee: APP_CONFIG.FORMS.LABELS.EMPLOYEE,
    manager: APP_CONFIG.FORMS.LABELS.MANAGER,
    admin: APP_CONFIG.FORMS.LABELS.ADMIN,
  };
  return roleMap[value] || value;
};

export const getLeaveTypeLabel = (value: string): string => {
  const typeMap: Record<string, string> = {
    annual: 'Annual Leave',
    sick: 'Sick Leave',
    casual: 'Casual Leave',
    maternity: 'Maternity Leave',
    paternity: 'Paternity Leave',
    emergency: 'Emergency Leave',
  };
  return typeMap[value] || value;
};

export const getStatusLabel = (value: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    escalated: 'Escalated',
  };
  return statusMap[value] || value;
};

// Export individual sections for easier imports
export const {
  UI,
  BUSINESS,
  FORMS,
  MESSAGES,
  SALARY,
  DASHBOARD,
  COMPANY,
  PERFORMANCE,
  TIME,
  UPLOAD,
  SECURITY,
} = APP_CONFIG;
