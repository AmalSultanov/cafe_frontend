import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

export interface User {
  id: number;
  name: string | null;
  surname: string | null;
  phone_number: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phoneNumber: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUser: (userData: any) => void;
  validateUser: () => Promise<void>;
}

export interface RegisterData {
  username: string;
  name?: string;
  surname?: string;
  phone_number: string;
  provider: string;
  provider_id: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuthStatus();

    const handleAuthExpired = () => {
      console.log('Authentication expired, logging out user');
      setUser(null);
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      toast.error('Session expired. Please log in again.');
    };

    window.addEventListener('authExpired', handleAuthExpired);

    return () => {
      window.removeEventListener('authExpired', handleAuthExpired);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);

      const currentUser = await authService.validateCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phoneNumber: string): Promise<boolean> => {
    try {
      const userData = await authService.login(phoneNumber);
      setUser(userData);
      toast.success('Successfully logged in!');
      return true;
    } catch (error: any) {
      let message = 'Login failed';

      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          message = detail;
        } else if (Array.isArray(detail)) {
          message = detail.map((err: any) => err.msg || err.message || 'Validation error').join(', ');
        } else if (typeof detail === 'object') {
          message = detail.msg || detail.message || 'Login failed';
        }
      }

      toast.error(message);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const result = await authService.register(userData);
      setUser(result.user);
      toast.success('Registration successful!');

      return true;
    } catch (error: any) {
      let message = 'Registration failed';

      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          message = detail;
        } else if (Array.isArray(detail)) {
          message = detail.map((err: any) => err.msg || err.message || 'Validation error').join(', ');
        } else if (typeof detail === 'object') {
          message = detail.msg || detail.message || 'Registration failed';
        }
      }

      toast.error(message);
      return false;
    }
  };

  const logout = async () => {
    try {
      const currentUserId = user?.id;

      await authService.logout(currentUserId);
      setUser(null);

      window.dispatchEvent(new CustomEvent('cartUpdated'));
      toast.success('Logged out successfully');
    } catch (error) {
      setUser(null);

      window.dispatchEvent(new CustomEvent('cartUpdated'));
      toast.success('Logged out successfully');
      console.error('Logout error:', error);
    }
  };

  const refreshAuth = async () => {
    try {
      await authService.refreshToken();
      const userData = await authService.validateCurrentUser();
      setUser(userData);
      console.log('Token refreshed successfully');
    } catch (error) {
      console.log('Token refresh failed:', error);
      setUser(null);
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    }
  };

  const updateUser = (userData: any) => {
    setUser(userData);
  };

  const validateUser = async () => {
    try {
      const userData = await authService.validateCurrentUser();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshAuth,
    updateUser,
    validateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
