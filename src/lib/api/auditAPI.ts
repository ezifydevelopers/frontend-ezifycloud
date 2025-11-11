// Audit API endpoints
import { apiRequest } from './base';
import { ApiResponse } from '../../types/api';

export const auditAPI = {
  // Get audit logs
  getAuditLogs: (filters?: {
    itemId?: string;
    userId?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
    fieldName?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    logs: Array<{
      id: string;
      itemId: string;
      userId: string;
      action: string;
      fieldName?: string;
      oldValue?: unknown;
      newValue?: unknown;
      details?: Record<string, unknown>;
      createdAt: string;
      user?: {
        id: string;
        name: string;
        email: string;
        profilePicture?: string;
      };
    }>;
    total: number;
  }>> =>
    apiRequest(`/audit/logs${filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : ''}`),

  // Get field history
  getFieldHistory: (itemId: string, fieldName: string): Promise<ApiResponse<unknown[]>> =>
    apiRequest(`/audit/field/${itemId}/${fieldName}`),

  // Export audit logs
  exportAuditLogs: (filters?: {
    itemId?: string;
    userId?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<unknown[]>> =>
    apiRequest(`/audit/export${filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : ''}`),
};

