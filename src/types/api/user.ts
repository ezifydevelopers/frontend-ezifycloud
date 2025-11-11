// User API types

import { UserRole } from '../auth';

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  department?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  bio?: string;
  address?: string;
  emergencyContact?: string;
}

export interface UpdateAvatarRequest {
  avatar: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ToggleUserStatusRequest {
  isActive: boolean;
}

export interface EmployeeParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  managerId?: string;
  phone?: string;
  bio?: string;
}

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  department?: string;
  managerId?: string;
  salary?: number;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  avatar?: string;
}

