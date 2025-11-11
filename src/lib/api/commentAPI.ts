// Comment API endpoints
import { apiRequest } from './base';
import { ApiResponse } from '../../types/api';

export const commentAPI = {
  // Create comment
  createComment: (data: { itemId: string; content: string; mentions?: string[]; isPrivate?: boolean; parentId?: string }): Promise<ApiResponse<unknown>> =>
    apiRequest('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Get comments for an item
  getItemComments: (itemId: string, params?: { parentId?: string | null; includeDeleted?: boolean }): Promise<ApiResponse<unknown[]>> =>
    apiRequest(`/comments/item/${itemId}${params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),
  
  // Get comment by ID
  getCommentById: (commentId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/comments/${commentId}`),
  
  // Update comment
  updateComment: (commentId: string, data: { content?: string; mentions?: string[]; isPrivate?: boolean }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Delete comment
  deleteComment: (commentId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/comments/${commentId}`, {
      method: 'DELETE',
    }),
  
  // Add reaction
  addReaction: (commentId: string, emoji: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/comments/${commentId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),

  // Upload file for comment
  uploadCommentFile: (data: {
    commentId?: string;
    itemId: string;
    fileName: string;
    fileData: string;
    mimeType: string;
    fileSize: number;
  }): Promise<ApiResponse<unknown>> =>
    apiRequest('/comments/files/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get comment files
  getCommentFiles: (commentId: string): Promise<ApiResponse<unknown[]>> =>
    apiRequest(`/comments/${commentId}/files`),

  // Delete comment file
  deleteCommentFile: (fileId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/comments/files/${fileId}`, {
      method: 'DELETE',
    }),

  // Pin/unpin comment
  pinComment: (commentId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/comments/${commentId}/pin`, {
      method: 'POST',
    }),

  // Resolve/unresolve comment
  resolveComment: (commentId: string, resolved: boolean): Promise<ApiResponse<unknown>> =>
    apiRequest(`/comments/${commentId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolved }),
    }),
};

