import api, { tokenManager } from './api';
import { debugLog } from '../utils/debug';
import { config } from '../utils/mockConfig';

// ===== INTERFACES SYNCHRONISÉES AVEC LE BACKEND =====

export interface User {
  user_id: string;
  email: string;
  username: string;
  profile_picture?: string;
}

export interface LoginRequest {
  email: string;
  code: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  is_new_user: boolean;
  message: string;
  user_data: Record<string, any>; // Backend retourne "additionalProperties": true
}

export interface SendCodeRequest {
  email: string;
}

export interface SendCodeResponse {
  message: string;
}

export interface LogoutResponse {
  message: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  user_id: string;
  email: string;
  username: string;
}

export const authService = {
  // Send magic link/code to email
  sendMagicCode: async (email: string): Promise<SendCodeResponse> => {
    debugLog.auth('Sending magic code', { email });
    
    // CORRIGÉ: URL et paramètres conformes au backend
    const response = await api.post<SendCodeResponse>(
      '/api/auth/send-code', 
      { email },
      { timeout: 60000 }
    );
    debugLog.auth('Magic code response', response.data);
    return response.data;
  },

  // Verify code and login
  login: async (email: string, code: string): Promise<LoginResponse> => {
    debugLog.auth('Login attempt', { email, code: '***' });
    
    // CORRIGÉ: URL conforme au backend
    const response = await api.post<LoginResponse>('/api/auth/login', { 
      email, 
      code 
    }, { timeout: 60000 });
    
    // Debug: Log the complete login response
    debugLog.auth('Login response', {
      access_token: response.data.access_token ? '***PRESENT***' : 'MISSING',
      token_type: response.data.token_type,
      is_new_user: response.data.is_new_user,
      message: response.data.message,
      user_data: response.data.user_data
    });
    
    // Store the token
    if (response.data.access_token) {
      tokenManager.setToken(response.data.access_token);
      debugLog.auth('Token stored successfully');
    }
    
    return response.data;
  },

  // Get current user info
  getCurrentUser: async (): Promise<UserResponse> => {
    
    // CORRIGÉ: URL conforme au backend
  const response = await api.get<UserResponse>('/api/auth/me', { timeout: 60000 });
    
    // Debug: Log the user data
    debugLog.user('Current user data', response.data);
    
    return response.data;
  },

  // Logout
  logout: async (): Promise<LogoutResponse> => {
    try {
      debugLog.auth('Logout attempt');
      
      // CORRIGÉ: URL conforme au backend
  const response = await api.post<LogoutResponse>('/api/auth/logout', undefined, { timeout: 60000 });
      debugLog.auth('Logout response', response.data);
      return response.data;
    } catch (error) {
      // Even if logout fails on backend, clear local token
      debugLog.warn('Logout request failed', error);
      return { message: "Logout successful" };
    } finally {
      tokenManager.removeToken();
      debugLog.auth('Token removed locally');
    }
  },

  // Refresh token if needed
  refreshToken: async (refreshToken: string): Promise<RefreshResponse> => {
    debugLog.auth('Refreshing token');
    
    // CORRIGÉ: URL et structure conforme au backend
    const response = await api.post<RefreshResponse>('/api/auth/refresh', {
      refresh_token: refreshToken
    }, { timeout: 60000 });
    
    const newToken = response.data.access_token;
    tokenManager.setToken(newToken);
    debugLog.auth('Token refreshed successfully');
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!tokenManager.getToken();
  },

  // Clear authentication data (force logout without backend call)
  clearAuth: (): void => {
    tokenManager.removeToken();
    debugLog.auth('Authentication data cleared');
  },

  // NOUVEAU: Health check de l'auth
  healthCheck: async (): Promise<any> => {
    debugLog.auth('Auth health check');
    
  const response = await api.get('/api/auth/health', { timeout: 60000 });
    return response.data;
  },
};
