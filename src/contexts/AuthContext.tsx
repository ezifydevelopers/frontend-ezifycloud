import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType, LoginCredentials, SignupData } from '@/types/auth';
import { authAPI } from '@/lib/api';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        return JSON.parse(storedUser);
      }
    } catch (error) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    return null;
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user and token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Validate user data structure
          if (userData && userData.id && userData.email && userData.role) {
            setUser(userData);
          } else {
            // Clear invalid data
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } catch (error) {
          // Clear invalid data
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
      
      // Set loading to false after checking
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Clear all cached data before login
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
      
      const data = await authAPI.login(email, password);

      if (data.success && data.data) {
        setUser(data.data.user);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('token', data.data.token);
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Clear any other cached data
    localStorage.clear();
    // Force redirect to login page
    window.location.href = '/login';
  };

  const clearAuthData = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };


  const signup = async (userData: SignupData): Promise<void> => {
    setIsLoading(true);
    try {
      const data = await authAPI.register(userData);

      if (data.success && data.data) {
        // Handle both user and token from registration response
        if (data.data.user && data.data.token) {
          setUser(data.data.user);
          localStorage.setItem('user', JSON.stringify(data.data.user));
          localStorage.setItem('token', data.data.token);
        } else {
          // Fallback for old API response format - this shouldn't happen with current API
          throw new Error('Invalid API response format');
        }
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      const data = await authAPI.forgotPassword(email);

      if (!data.success) {
        throw new Error(data.message || 'Password reset failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      clearAuthData,
      signup,
      resetPassword,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};