// File API endpoints
import { apiRequest } from './base';
import { ApiResponse } from '../../types/api';
import { getApiBaseUrl } from './base';

export const fileAPI = {
  // Upload file (base64)
  uploadFile: (data: { itemId: string; fileName: string; fileData: string; mimeType: string; fileSize: number }): Promise<ApiResponse<unknown>> =>
    apiRequest('/files/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Get files for an item
  getItemFiles: (itemId: string): Promise<ApiResponse<unknown[]>> =>
    apiRequest(`/files/item/${itemId}`),
  
  // Get file by ID
  getFileById: (fileId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/files/${fileId}`),
  
  // Download file
  downloadFile: (fileId: string): Promise<Blob> => {
    const API_BASE_URL = getApiBaseUrl();
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE_URL}/files/${fileId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }).then(response => {
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      return response.blob();
    });
  },
  
  // Delete file
  deleteFile: (fileId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/files/${fileId}`, {
      method: 'DELETE',
    }),
  
  // Get file preview URL
  // Note: This URL might return 400/404 for files user doesn't have access to
  // Components should handle these errors gracefully
  getFilePreviewUrl: (fileId: string): string => {
    const API_BASE_URL = getApiBaseUrl();
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/files/${fileId}/download?token=${token}`;
  },

  // Rename file
  renameFile: (fileId: string, newFileName: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/files/${fileId}/rename`, {
      method: 'PATCH',
      body: JSON.stringify({ newFileName }),
    }),

  // Move file to another item
  moveFile: (fileId: string, targetItemId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/files/${fileId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ targetItemId }),
    }),

  // Replace file
  replaceFile: (fileId: string, data: {
    fileName: string;
    fileData: string;
    mimeType: string;
    fileSize: number;
  }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/files/${fileId}/replace`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Bulk download (returns file list, frontend creates ZIP)
  bulkDownload: (itemIds: string[]): Promise<ApiResponse<unknown[]>> =>
    apiRequest('/files/bulk-download', {
      method: 'POST',
      body: JSON.stringify({ itemIds }),
    }),
};

