// Authentication API endpoints
import { apiRequest } from './base';
import {
  ApiResponse,
  LoginResponse,
  RegisterRequest,
} from '../../types/api';

export const authAPI = {
  login: (email: string, password: string): Promise<ApiResponse<LoginResponse>> =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  register: (userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  
  forgotPassword: (email: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  
  resetPassword: (token: string, password: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
  
  changePassword: (currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

