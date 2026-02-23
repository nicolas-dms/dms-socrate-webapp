import axios from 'axios';
import { getApiUrlSync } from './configService';

// Create axios instance — baseURL is overridden per-request from the cached config
const api = axios.create({
  baseURL: 'http://localhost:8000', // overridden by request interceptor below
  // Increase default timeout to 60s to accommodate slower endpoints (e.g., auth email send)
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
export const tokenManager = {
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  },
  
  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  },
  
  removeToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  },
};

// Request interceptor: set baseURL from runtime config cache + attach JWT
api.interceptors.request.use(
  (config) => {
    // Override baseURL with the runtime value resolved from /api/config
    config.baseURL = getApiUrlSync();
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      tokenManager.removeToken();
      // Optionally redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
