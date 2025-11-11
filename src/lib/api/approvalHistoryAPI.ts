// Approval History API

import { apiRequest, getApiBaseUrl } from './base';
import { ApiResponse } from '../../types/api';

export interface ApprovalHistoryEntry {
  id: string;
  level: string;
  status: string;
  comments?: string;
  approver?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  approvedAt?: string;
  updatedAt: string;
  timeTaken?: number; // in hours
}

export interface ApprovalHistory {
  itemId: string;
  itemName: string;
  entries: ApprovalHistoryEntry[];
  totalTime?: number; // total time across all levels in hours
}

export const approvalHistoryAPI = {
  /**
   * Get approval history for an item
   */
  getApprovalHistory: async (itemId: string): Promise<ApiResponse<ApprovalHistory>> => {
    try {
      const response = await apiRequest<ApiResponse<ApprovalHistory>>(`/approvals/items/${itemId}/history`);
      return response;
    } catch (error: any) {
      console.error('Error fetching approval history:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch approval history',
      };
    }
  },

  /**
   * Export approval history as CSV
   */
  exportApprovalHistory: async (itemId: string): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const API_BASE_URL = getApiBaseUrl();
    
    const response = await fetch(`${API_BASE_URL}/approvals/items/${itemId}/history/export`, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export approval history');
    }

    return response.blob();
  },
};

