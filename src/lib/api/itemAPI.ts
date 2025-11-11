// Item and cell operations API

import { apiRequest } from './base';
import { ApiResponse, PaginatedResponse } from '../../types/api';

export const itemAPI = {
  /**
   * Get items for a board
   * @deprecated Use getItems instead
   */
  getBoardItems: (
    boardId: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<unknown>>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.search !== undefined && params.search !== '') {
        queryParams.append('search', params.search);
      }
      if (params.status !== undefined && params.status !== '') {
        queryParams.append('status', params.status);
      }
      if (params.sortBy !== undefined && params.sortBy !== '') {
        queryParams.append('sortBy', params.sortBy);
      }
      if (params.sortOrder !== undefined && params.sortOrder !== '') {
        queryParams.append('sortOrder', params.sortOrder);
      }
    }
    const queryString = queryParams.toString();
    return apiRequest(`/boards/${boardId}/items${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Get a single item by ID
   */
  getItemById: (itemId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/boards/items/${itemId}`),

  /**
   * Create a new item
   */
  createItem: (
    boardId: string,
    data: {
      name: string;
      status?: string;
      cells?: Record<string, unknown>;
    }
  ): Promise<ApiResponse<unknown>> =>
    apiRequest(`/boards/${boardId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update an item
   */
  updateItem: (
    itemId: string,
    data: {
      name?: string;
      status?: string;
      cells?: Record<string, unknown>;
    }
  ): Promise<ApiResponse<unknown>> =>
    apiRequest(`/boards/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete an item
   */
  deleteItem: (itemId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/boards/items/${itemId}`, {
      method: 'DELETE',
    }),

  /**
   * Duplicate an item
   */
  duplicateItem: (itemId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/boards/items/${itemId}/duplicate`, {
      method: 'POST',
    }),

  /**
   * Update a specific cell value
   */
  updateCell: (
    itemId: string,
    columnId: string,
    value: unknown
  ): Promise<ApiResponse<unknown>> =>
    apiRequest(`/boards/items/${itemId}/cells/${columnId}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),

  /**
   * Bulk update items
   */
  bulkUpdateItems: (
    itemIds: string[],
    data: {
      status?: string;
      cells?: Record<string, unknown>;
    }
  ): Promise<ApiResponse<{ updated: number }>> =>
    apiRequest('/boards/items/bulk-update', {
      method: 'PUT',
      body: JSON.stringify({ itemIds, ...data }),
    }),

  /**
   * Bulk delete items
   */
  bulkDeleteItems: (itemIds: string[]): Promise<ApiResponse<{ deleted: number }>> =>
    apiRequest('/boards/items/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ itemIds }),
    }),

  /**
   * Get deleted items for a board
   */
  getDeletedItems: (
    boardId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<PaginatedResponse<unknown>>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    }
    queryParams.append('deleted', 'true');
    const queryString = queryParams.toString();
    return apiRequest(`/boards/${boardId}/items${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Restore a deleted item
   */
  restoreItem: (itemId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/boards/items/${itemId}/restore`, {
      method: 'POST',
    }),

  /**
   * Permanently delete an item (hard delete)
   */
  permanentlyDeleteItem: (itemId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/boards/items/${itemId}/permanent`, {
      method: 'DELETE',
    }),

  /**
   * Bulk restore items
   */
  bulkRestoreItems: (itemIds: string[]): Promise<ApiResponse<{ restored: number }>> =>
    apiRequest('/boards/items/bulk-restore', {
      method: 'POST',
      body: JSON.stringify({ itemIds }),
    }),

  /**
   * Bulk permanently delete items
   */
  bulkPermanentlyDeleteItems: (itemIds: string[]): Promise<ApiResponse<{ deleted: number }>> =>
    apiRequest('/boards/items/bulk-permanent-delete', {
      method: 'POST',
      body: JSON.stringify({ itemIds }),
    }),

  /**
   * Move item to another board
   */
  moveItem: (
    itemId: string,
    targetBoardId: string
  ): Promise<ApiResponse<unknown>> =>
    apiRequest(`/boards/items/${itemId}/move`, {
      method: 'POST',
      body: JSON.stringify({ targetBoardId }),
    }),

  /**
   * Copy item to another board
   */
  copyItem: (
    itemId: string,
    targetBoardId: string
  ): Promise<ApiResponse<unknown>> =>
    apiRequest(`/boards/items/${itemId}/copy`, {
      method: 'POST',
      body: JSON.stringify({ targetBoardId }),
    }),

  /**
   * Bulk move items to another board
   */
  bulkMoveItems: (
    itemIds: string[],
    targetBoardId: string
  ): Promise<ApiResponse<{ moved: number }>> =>
    apiRequest('/boards/items/bulk-move', {
      method: 'POST',
      body: JSON.stringify({ itemIds, targetBoardId }),
    }),

  /**
   * Bulk copy items to another board
   */
  bulkCopyItems: (
    itemIds: string[],
    targetBoardId: string
  ): Promise<ApiResponse<{ copied: number }>> =>
    apiRequest('/boards/items/bulk-copy', {
      method: 'POST',
      body: JSON.stringify({ itemIds, targetBoardId }),
    }),

  /**
   * Archive an item
   */
  archiveItem: (itemId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/boards/items/${itemId}/archive`, {
      method: 'POST',
    }),

  /**
   * Restore an archived item
   */
  restoreArchivedItem: (itemId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/boards/items/${itemId}/unarchive`, {
      method: 'POST',
    }),

  /**
   * Get archived items for a board
   */
  getArchivedItems: (
    boardId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<PaginatedResponse<unknown>>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    }
    queryParams.append('archived', 'true');
    const queryString = queryParams.toString();
    return apiRequest(`/boards/${boardId}/items${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Bulk archive items
   */
  bulkArchiveItems: (itemIds: string[]): Promise<ApiResponse<{ archived: number }>> =>
    apiRequest('/boards/items/bulk-archive', {
      method: 'POST',
      body: JSON.stringify({ itemIds }),
    }),

  /**
   * Bulk restore archived items
   */
  bulkRestoreArchivedItems: (itemIds: string[]): Promise<ApiResponse<{ restored: number }>> =>
    apiRequest('/boards/items/bulk-unarchive', {
      method: 'POST',
      body: JSON.stringify({ itemIds }),
    }),
};

