// Leave API endpoints
import { apiRequest } from './base';
import {
  ApiResponse,
  CreateLeaveRequest,
  UpdateLeaveRequest,
  PaginatedResponse,
} from '../../types/api';
import { LeaveRequest } from '../../types/leave';

export const leaveAPI = {
  getLeaves: (): Promise<ApiResponse<PaginatedResponse<LeaveRequest>>> => apiRequest('/leaves'),
  
  createLeave: (leaveData: CreateLeaveRequest): Promise<ApiResponse<LeaveRequest>> =>
    apiRequest('/leaves', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    }),
  
  getLeaveById: (id: string): Promise<ApiResponse<LeaveRequest>> => apiRequest(`/leaves/${id}`),
  
  updateLeave: (id: string, leaveData: UpdateLeaveRequest): Promise<ApiResponse<LeaveRequest>> =>
    apiRequest(`/leaves/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leaveData),
    }),
  
  updateLeaveStatus: (id: string, status: string, reason?: string): Promise<ApiResponse<LeaveRequest>> =>
    apiRequest(`/leaves/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),
};

