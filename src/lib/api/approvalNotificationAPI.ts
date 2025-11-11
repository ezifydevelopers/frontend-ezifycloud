// Approval Notification API - For reminders and deadline alerts

import { apiRequest } from './base';

export const approvalNotificationAPI = {
  /**
   * Send approval reminders
   */
  sendReminders: async (hoursSinceCreation?: number): Promise<{ success: boolean; message: string }> => {
    return apiRequest('/approvals/reminders/send', {
      method: 'POST',
      body: JSON.stringify({ hoursSinceCreation: hoursSinceCreation || 24 }),
    });
  },

  /**
   * Check and send deadline alerts
   */
  checkDeadlines: async (hoursBeforeDeadline?: number): Promise<{ success: boolean; message: string }> => {
    return apiRequest('/approvals/deadlines/check', {
      method: 'POST',
      body: JSON.stringify({ hoursBeforeDeadline: hoursBeforeDeadline || 24 }),
    });
  },
};

