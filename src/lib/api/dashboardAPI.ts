// Dashboard API endpoints
import { apiRequest } from './base';
import {
  ApiResponse,
  DashboardStatsParams,
  DashboardStats,
  ManagerDashboardStats,
  QuickStats,
  RecentActivity,
  EmployeeDashboardStats,
} from '../../types/api';

export const dashboardAPI = {
  // Create dashboard
  createDashboard: (data: {
    workspaceId: string;
    name: string;
    description?: string;
    widgets?: unknown[];
    isPublic?: boolean;
  }): Promise<ApiResponse<unknown>> =>
    apiRequest('/dashboards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get workspace dashboards
  getWorkspaceDashboards: (workspaceId: string): Promise<ApiResponse<unknown[]>> =>
    apiRequest(`/dashboards/workspace/${workspaceId}`),

  // Get dashboard by ID
  getDashboardById: (dashboardId: string): Promise<ApiResponse<unknown>> =>
    apiRequest(`/dashboards/${dashboardId}`),

  // Update dashboard
  updateDashboard: (dashboardId: string, data: {
    name?: string;
    description?: string;
    widgets?: unknown[];
    isPublic?: boolean;
  }): Promise<ApiResponse<unknown>> =>
    apiRequest(`/dashboards/${dashboardId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete dashboard
  deleteDashboard: (dashboardId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/dashboards/${dashboardId}`, {
      method: 'DELETE',
    }),

  // Get board metrics
  getBoardMetrics: (boardId: string, filters?: {
    dateFrom?: string;
    dateTo?: string;
    status?: string[];
  }): Promise<ApiResponse<{
    totalItems: number;
    totalValue: number;
    averageValue: number;
    itemsByStatus: Record<string, number>;
    itemsByDate: Array<{ date: string; count: number; value: number }>;
    topItems: Array<{ id: string; name: string; value: number }>;
  }>> =>
    apiRequest(`/dashboards/board/${boardId}/metrics${filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : ''}`),

  // Calculate widget data
  calculateWidgetData: (widget: unknown): Promise<ApiResponse<unknown>> =>
    apiRequest('/dashboards/widgets/calculate', {
      method: 'POST',
      body: JSON.stringify(widget),
    }),
};

