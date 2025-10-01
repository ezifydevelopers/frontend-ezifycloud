import { apiRequest } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { User, SignupData } from '@/types/auth';

export interface UserService {
  getProfile: () => Promise<User>;
  updateProfile: (userData: Partial<User>) => Promise<User>;
  getAllUsers: () => Promise<User[]>;
  getUserById: (id: string) => Promise<User>;
  getManagers: () => Promise<User[]>;
  createUser: (userData: SignupData) => Promise<User>;
}

export const userService: UserService = {
  getProfile: () => apiRequest(API_ENDPOINTS.USERS.PROFILE),
  
  updateProfile: (userData) => 
    apiRequest(API_ENDPOINTS.USERS.PROFILE, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  
  getAllUsers: () => apiRequest(API_ENDPOINTS.USERS.ALL),
  
  getUserById: (id) => apiRequest(API_ENDPOINTS.USERS.BY_ID(id)),
  
  getManagers: async () => {
    const users = await apiRequest(API_ENDPOINTS.USERS.ALL);
    return users.filter((user: User) => user.role === 'manager' || user.role === 'admin');
  },
  
  createUser: (userData) => 
    apiRequest(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
};

