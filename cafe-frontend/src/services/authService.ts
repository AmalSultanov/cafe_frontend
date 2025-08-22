import axios from 'axios';
import type { User, RegisterData } from '../contexts/AuthContext';
import { apiBaseUrl } from '../config/env';

interface RegisterResponse {
  user: User;
  access_token?: string;
  refresh_token?: string;
}

class AuthService {
  public axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: apiBaseUrl,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (originalRequest.url?.includes('/tokens/refresh-access')) {
          window.dispatchEvent(new CustomEvent('authExpired'));
          return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            window.dispatchEvent(new CustomEvent('authExpired'));
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async register(userData: RegisterData): Promise<RegisterResponse> {
    const response = await this.axiosInstance.post('/users/register', userData);
    return response.data;
  }

  async login(phoneNumber: string): Promise<User> {
    const response = await this.axiosInstance.post('/users/log-in', null, {
      params: { phone_number: phoneNumber }
    });
    return response.data;
  }

  async refreshToken(): Promise<void> {
    const response = await this.axiosInstance.post('/tokens/refresh-access');
    return response.data;
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await this.axiosInstance.get('/users/me');
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async logout(userId?: number): Promise<void> {
    try {
      if (userId) {
        await this.axiosInstance.post(`/users/${userId}/logout`);
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
  }

  async validateCurrentUser(): Promise<User | null> {
    try {
      const response = await this.axiosInstance.get('/users/me');
      return response.data;
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();
