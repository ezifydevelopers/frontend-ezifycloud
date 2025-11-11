// User API endpoints
import { apiRequest } from './base';
import {
  ApiResponse,
  UpdateProfileRequest,
  CreateUserRequest,
  UpdateUserRequest,
  PaginatedResponse,
} from '../../types/api';
import { User } from '../../types/auth';

export const userAPI = {
  getProfile: (): Promise<ApiResponse<User>> => apiRequest('/users/profile'),
  
  updateProfile: (userData: UpdateProfileRequest): Promise<ApiResponse<User>> =>
    apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  
  getAllUsers: (): Promise<ApiResponse<PaginatedResponse<User>>> => apiRequest('/users'),
  
  getUserById: (id: string): Promise<ApiResponse<User>> => apiRequest(`/users/${id}`),
  
  createUser: (userData: CreateUserRequest): Promise<ApiResponse<User>> => {
    const { managerId, ...restData } = userData;
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify({
        ...restData,
        manager_id: managerId || null, // Convert camelCase to snake_case, send null if undefined
      }),
    });
  },
  
  updateUser: (id: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> => {
    const { managerId, ...restData } = userData;
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...restData,
        manager_id: managerId || null, // Convert camelCase to snake_case, send null if undefined
      }),
    });
  },
  
  deleteUser: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/users/${id}`, {
      method: 'DELETE',
    }),
  
  toggleUserStatus: (id: string, isActive: boolean): Promise<ApiResponse<User>> =>
    apiRequest(`/users/${id}/toggle-status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
};

