// Permission API endpoints
import { apiRequest } from './base';
import { ApiResponse } from '../../types/api';

export const permissionAPI = {
  // Get permissions for a resource
  getPermissions: (
    resource: 'workspace' | 'board' | 'item' | 'column',
    resourceId: string
  ): Promise<ApiResponse<{
    read: boolean;
    write: boolean;
    delete: boolean;
    manage?: boolean;
  }>> =>
    apiRequest(`/permissions?resource=${resource}&resourceId=${resourceId}`),

  // Check specific permission
  checkPermission: (
    resource: 'workspace' | 'board' | 'item' | 'column',
    resourceId: string,
    action: 'read' | 'write' | 'delete' | 'manage'
  ): Promise<ApiResponse<{ hasPermission: boolean }>> =>
    apiRequest(`/permissions/check?resource=${resource}&resourceId=${resourceId}&action=${action}`),

  // Update board permissions
  updateBoardPermissions: (
    boardId: string,
    permissions: Record<string, {
      read: boolean;
      write: boolean;
      delete: boolean;
      manage?: boolean;
    }>
  ): Promise<ApiResponse<unknown>> =>
    apiRequest(`/permissions/board/${boardId}`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    }),

  // Update column permissions
  updateColumnPermissions: (
    columnId: string,
    permissions: {
      read?: boolean | Record<string, boolean>;
      write?: boolean | Record<string, boolean>;
      delete?: boolean | Record<string, boolean>;
    }
  ): Promise<ApiResponse<unknown>> =>
    apiRequest(`/permissions/column/${columnId}`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    }),
};

