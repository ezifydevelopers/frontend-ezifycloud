// Workspace API endpoints
import { apiRequest } from './base';
import {
  ApiResponse,
  PaginatedResponse,
} from '../../types/api';

export const workspaceAPI = {
  // Workspace CRUD
  createWorkspace: (data: { name: string; description?: string; logo?: string; settings?: Record<string, unknown> }): Promise<ApiResponse<{ workspace: unknown; member: unknown }>> => {
    // Clean the data before sending - remove undefined and empty string logo
    const cleanedData: Record<string, unknown> = {
      name: data.name,
    };
    if (data.description !== undefined && data.description !== '') {
      cleanedData.description = data.description;
    }
    if (data.logo !== undefined && data.logo !== '') {
      cleanedData.logo = data.logo;
    }
    if (data.settings) {
      cleanedData.settings = data.settings;
    }
    return apiRequest('/workspaces', {
      method: 'POST',
      body: JSON.stringify(cleanedData),
    });
  },
  
  getWorkspaces: (params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<PaginatedResponse<unknown>>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.search !== undefined && params.search !== null && params.search !== '') {
        queryParams.append('search', params.search);
      }
    }
    const queryString = queryParams.toString();
    return apiRequest(`/workspaces${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Get all workspaces for the current user (alias for getWorkspaces)
   */
  getUserWorkspaces: (params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<PaginatedResponse<unknown>>> => {
    return workspaceAPI.getWorkspaces(params);
  },
  
  getWorkspaceById: (id: string): Promise<ApiResponse<unknown>> => apiRequest(`/workspaces/${id}`),
  
  updateWorkspace: (id: string, data: { name?: string; description?: string; logo?: string; settings?: Record<string, unknown> }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/workspaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteWorkspace: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/workspaces/${id}`, {
      method: 'DELETE',
    }),
  
  // Member management
  getWorkspaceMembers: (workspaceId: string): Promise<ApiResponse<unknown[]>> => apiRequest(`/workspaces/${workspaceId}/members`),
  
  getInvitations: (workspaceId: string, status: 'pending' | 'accepted' | 'all' = 'pending'): Promise<ApiResponse<unknown[]>> =>
    apiRequest(`/workspaces/${workspaceId}/invitations${status ? `?status=${status}` : ''}`),
  
  transferOwnership: (workspaceId: string, newOwnerUserId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/workspaces/${workspaceId}/members/transfer-ownership`, {
      method: 'POST',
      body: JSON.stringify({ newOwnerUserId }),
    }),
  
  inviteMember: (workspaceId: string, data: { email: string; role: string }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/workspaces/${workspaceId}/members/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  resendInvitation: (workspaceId: string, inviteId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/workspaces/${workspaceId}/invitations/${inviteId}/resend`, { method: 'POST' }),
  
  cancelInvitation: (workspaceId: string, inviteId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/workspaces/${workspaceId}/invitations/${inviteId}`, { method: 'DELETE' }),
  
  updateMemberRole: (workspaceId: string, memberId: string, role: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/workspaces/${workspaceId}/members/${memberId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  
  removeMember: (workspaceId: string, memberId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'DELETE',
    }),
  
  acceptInvitation: (token: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/workspaces/invitations/${token}/accept`, {
      method: 'POST',
    }),
};

