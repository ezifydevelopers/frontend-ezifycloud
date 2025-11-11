// Automation API endpoints
import { apiRequest } from './base';
import {
  ApiResponse,
  PaginatedResponse,
} from '../../types/api';

export const automationAPI = {
  // Create automation
  createAutomation: (data: {
    boardId: string;
    name: string;
    trigger: Record<string, unknown>;
    actions: Array<Record<string, unknown>>;
    conditions?: Record<string, unknown>;
    isActive?: boolean;
  }): Promise<ApiResponse<unknown>> =>
    apiRequest('/automations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get automations
  getAutomations: (params?: {
    boardId?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ data: unknown[]; pagination: PaginatedResponse<unknown> }>> => {
    const query = new URLSearchParams();
    if (params?.boardId) query.append('boardId', params.boardId);
    if (typeof params?.isActive === 'boolean') query.append('isActive', String(params.isActive));
    if (params?.search && params.search.trim() !== '') query.append('search', params.search.trim());
    if (typeof params?.page === 'number') query.append('page', String(params.page));
    if (typeof params?.limit === 'number') query.append('limit', String(params.limit));
    const qs = query.toString();
    return apiRequest(`/automations${qs ? `?${qs}` : ''}`);
  },

  // Get automation by ID
  getAutomationById: (id: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/automations/${id}`),

  // Update automation
  updateAutomation: (id: string, data: {
    name?: string;
    trigger?: Record<string, unknown>;
    actions?: Array<Record<string, unknown>>;
    conditions?: Record<string, unknown>;
    isActive?: boolean;
  }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/automations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete automation
  deleteAutomation: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/automations/${id}`, {
      method: 'DELETE',
    }),

  // Toggle automation
  toggleAutomation: (id: string, isActive: boolean): Promise<ApiResponse<unknown>> =>
    apiRequest(`/automations/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

  // Test automation
  testAutomation: (id: string, itemId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/automations/${id}/test`, {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    }),
};

