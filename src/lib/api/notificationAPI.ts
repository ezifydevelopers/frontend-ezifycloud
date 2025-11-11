// Notification API

import { apiRequest } from './base';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  emailSent: boolean;
  emailSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
  message?: string;
}

export interface UnreadCountResponse {
  success: boolean;
  data: { count: number };
}

export const notificationAPI = {
  /**
   * Get user notifications
   */
  getNotifications: async (options?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<NotificationResponse> => {
    const params = new URLSearchParams();
    if (options?.unreadOnly) params.append('unreadOnly', 'true');
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    return apiRequest<NotificationResponse>(`/notifications?${params.toString()}`);
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    return apiRequest<UnreadCountResponse>('/notifications/unread-count');
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ success: boolean; message: string }> => {
    return apiRequest('/notifications/read-all', {
      method: 'PUT',
    });
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },
};

