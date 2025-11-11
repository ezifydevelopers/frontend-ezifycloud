// Report API endpoints
import { apiRequest } from './base';
import { ApiResponse } from '../../types/api';

export const reportAPI = {
  // Create report
  createReport: (data: {
    workspaceId?: string;
    boardId?: string;
    name: string;
    type: 'invoice_summary' | 'approval_status' | 'payment_status' | 'aging' | 'custom';
    config: {
      columns?: string[];
      filters?: Record<string, unknown>;
      grouping?: unknown;
      sorting?: unknown;
    };
    schedule?: unknown;
    isActive?: boolean;
  }): Promise<ApiResponse<unknown>> =>
    apiRequest('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get workspace reports
  getWorkspaceReports: (workspaceId: string): Promise<ApiResponse<unknown[]>> =>
    apiRequest(`/reports/workspace/${workspaceId}`),

  // Get report by ID
  getReportById: (reportId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/reports/${reportId}`),

  // Update report
  updateReport: (reportId: string, data: {
    name?: string;
    config?: unknown;
    schedule?: unknown;
    isActive?: boolean;
  }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete report
  deleteReport: (reportId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/reports/${reportId}`, {
      method: 'DELETE',
    }),

  // Generate report
  generateReport: (data: {
    type: 'invoice_summary' | 'approval_status' | 'payment_status' | 'aging' | 'custom';
    boardId?: string;
    workspaceId?: string;
    config: unknown;
  }): Promise<ApiResponse<{
    columns: string[];
    rows: Array<Record<string, unknown>>;
    summary?: unknown;
    metadata: unknown;
  }>> =>
    apiRequest('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

