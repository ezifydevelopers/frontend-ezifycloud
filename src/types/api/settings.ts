// Settings API types

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

export interface SecuritySettingsUser {
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

export interface UpdateSecuritySettingsUserRequest {
  twoFactorEnabled?: boolean;
  loginNotificationsEnabled?: boolean;
  passwordChangeRequired?: boolean;
  sessionTimeoutMinutes?: number;
}

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

