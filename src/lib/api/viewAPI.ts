import { apiRequest } from './base';
import { ViewType } from '@prisma/client';

export interface SavedView {
  id: string;
  boardId: string;
  name: string;
  type: ViewType;
  settings?: Record<string, unknown>;
  isDefault: boolean;
  description?: string;
  isShared?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateViewInput {
  name: string;
  type: ViewType;
  settings?: Record<string, unknown>;
  isDefault?: boolean;
  description?: string;
  isShared?: boolean;
}

export interface UpdateViewInput {
  name?: string;
  settings?: Record<string, unknown>;
  isDefault?: boolean;
  description?: string;
  isShared?: boolean;
}

export const viewAPI = {
  /**
   * Get all views for a board
   */
  getBoardViews: async (boardId: string): Promise<{ success: boolean; data?: SavedView[]; message?: string }> => {
    return apiRequest<SavedView[]>(`/boards/${boardId}/views`, {
      method: 'GET',
    });
  },

  /**
   * Get a view by ID
   */
  getViewById: async (viewId: string): Promise<{ success: boolean; data?: SavedView; message?: string }> => {
    return apiRequest<SavedView>(`/boards/views/${viewId}`, {
      method: 'GET',
    });
  },

  /**
   * Create a new view
   */
  createView: async (
    boardId: string,
    data: CreateViewInput
  ): Promise<{ success: boolean; data?: SavedView; message?: string }> => {
    return apiRequest<SavedView>(`/boards/${boardId}/views`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a view
   */
  updateView: async (
    viewId: string,
    data: UpdateViewInput
  ): Promise<{ success: boolean; data?: SavedView; message?: string }> => {
    return apiRequest<SavedView>(`/boards/views/${viewId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a view
   */
  deleteView: async (viewId: string): Promise<{ success: boolean; message?: string }> => {
    return apiRequest(`/boards/views/${viewId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Set a view as default
   */
  setDefaultView: async (viewId: string): Promise<{ success: boolean; data?: SavedView; message?: string }> => {
    return apiRequest<SavedView>(`/boards/views/${viewId}/set-default`, {
      method: 'POST',
    });
  },
};

