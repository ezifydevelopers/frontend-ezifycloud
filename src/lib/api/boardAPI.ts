// Board API endpoints
import { apiRequest } from './base';
import {
  ApiResponse,
  PaginatedResponse,
} from '../../types/api';

export const boardAPI = {
  // Board CRUD
  createBoard: (data: { workspaceId: string; name: string; type: string; description?: string; color?: string; icon?: string }): Promise<ApiResponse<unknown>> =>
    apiRequest('/boards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getWorkspaceBoards: (workspaceId: string, params?: { page?: number; limit?: number; search?: string; type?: string; isArchived?: boolean }): Promise<ApiResponse<PaginatedResponse<unknown>>> =>
    apiRequest(`/boards/workspace/${workspaceId}${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  
  getBoardById: (id: string): Promise<ApiResponse<unknown>> => apiRequest(`/boards/${id}`),
  
  updateBoard: (id: string, data: { name?: string; description?: string; color?: string; icon?: string; isPublic?: boolean; isArchived?: boolean; settings?: Record<string, unknown> }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteBoard: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/boards/${id}`, {
      method: 'DELETE',
    }),
  
  // Column management
  getBoardColumns: (boardId: string): Promise<ApiResponse<unknown[]>> => apiRequest(`/boards/${boardId}/columns`),
  
  createColumn: (boardId: string, data: { name: string; type: string; position?: number; width?: number; required?: boolean; settings?: Record<string, unknown> }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/boards/${boardId}/columns`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateColumn: (id: string, data: { name?: string; type?: string; position?: number; width?: number; required?: boolean; isHidden?: boolean; settings?: Record<string, unknown> }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/boards/columns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteColumn: (id: string, options?: { keepDataAsMetadata?: boolean }): Promise<ApiResponse<{ message: string }>> => {
    const queryParams = new URLSearchParams();
    if (options?.keepDataAsMetadata) {
      queryParams.append('keepDataAsMetadata', 'true');
    }
    const queryString = queryParams.toString();
    return apiRequest(`/boards/columns/${id}${queryString ? '?' + queryString : ''}`, {
      method: 'DELETE',
    });
  },
  
  // Item management - moved to itemAPI.ts
  // For backward compatibility, re-export from itemAPI
  getBoardItems: (...args: Parameters<typeof import('./itemAPI').itemAPI.getBoardItems>) =>
    import('./itemAPI').itemAPI.getBoardItems(...args),
  createItem: (...args: Parameters<typeof import('./itemAPI').itemAPI.createItem>) =>
    import('./itemAPI').itemAPI.createItem(...args),
  updateItem: (...args: Parameters<typeof import('./itemAPI').itemAPI.updateItem>) =>
    import('./itemAPI').itemAPI.updateItem(...args),
  deleteItem: (...args: Parameters<typeof import('./itemAPI').itemAPI.deleteItem>) =>
    import('./itemAPI').itemAPI.deleteItem(...args),
};

