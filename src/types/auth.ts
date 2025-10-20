export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  managerId?: string;
  profilePicture?: string;
  isActive?: boolean;
  phone?: string;
  bio?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearAuthData: () => void;
  signup: (userData: Partial<User> & { password: string }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  department?: string;
  role?: UserRole;
  manager_id?: string | null;
}