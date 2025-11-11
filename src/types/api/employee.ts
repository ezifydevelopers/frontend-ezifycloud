// Employee API types

import { LeaveType, LeaveStatus } from '../leave';

export interface EmployeeDashboardStats {
  leaveBalance: {
    annual: number;
    sick: number;
    casual: number;
    emergency: number;
    usedAnnual: number;
    usedSick: number;
    usedCasual: number;
    usedEmergency: number;
  };
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

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
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

