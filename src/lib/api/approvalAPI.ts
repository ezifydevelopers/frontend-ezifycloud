// Approval API endpoints
import { apiRequest } from './base';
import { ApiResponse } from '../../types/api';

export const approvalAPI = {
  // Request approval for an item
  requestApproval: (itemId: string, data?: { levels?: string[] }): Promise<ApiResponse<unknown[]>> =>
    apiRequest(`/approvals/item/${itemId}/request`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),
  
  // Get approvals for an item
  getItemApprovals: (itemId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/approvals/item/${itemId}`),
  
  // Get my pending approvals
  getMyPendingApprovals: (): Promise<ApiResponse<unknown[]>> =>
    apiRequest('/approvals/pending'),
  
  // Create approval
  createApproval: (data: { itemId: string; level: string; approverId?: string }): Promise<ApiResponse<unknown>> =>
    apiRequest('/approvals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Get approval by ID
  getApprovalById: (approvalId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/approvals/${approvalId}`),
  
  // Update approval (approve/reject)
  updateApproval: (approvalId: string, data: { status: string; comments?: string; approverId?: string }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/approvals/${approvalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Delete approval
  deleteApproval: (approvalId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/approvals/${approvalId}`, {
      method: 'DELETE',
    }),

  // Get approved items
  getApprovedItems: (options?: {
    workspaceId?: string;
    boardId?: string;
    filter?: 'fully_approved' | 'partially_approved' | 'all';
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<unknown[]>> => {
    const params = new URLSearchParams();
    if (options?.workspaceId) params.append('workspaceId', options.workspaceId);
    if (options?.boardId) params.append('boardId', options.boardId);
    if (options?.filter) params.append('filter', options.filter);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.search) params.append('search', options.search);

    return apiRequest(`/approvals/approved-items?${params.toString()}`);
  },

  // Move item to different board
  moveItemToBoard: (itemId: string, targetBoardId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/approvals/items/${itemId}/move`, {
      method: 'POST',
      body: JSON.stringify({ targetBoardId }),
    }),

  // Archive approved item
  archiveItem: (itemId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/approvals/items/${itemId}/archive`, {
      method: 'POST',
    }),

  // Restore archived item
  restoreItem: (itemId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/approvals/items/${itemId}/restore`, {
      method: 'POST',
    }),
};

