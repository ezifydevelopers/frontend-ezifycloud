// Calendar API types

import { Holiday } from './admin';

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

