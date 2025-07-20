import api, { tokenManager } from './api';
import { debugLog } from '../utils/debug';
import { config } from '../utils/mockConfig';

export interface User {
  user_id: string;
  email: string;
  username: string;
  profile_picture?: string | null;
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
  user_data: User;
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

export const authService = {
  // Send magic link/code to email
  sendMagicCode: async (email: string): Promise<SendCodeResponse> => {
    debugLog.auth('Sending magic code', { email });
    
    if (config.MOCK_APIS) {
      // Mock response - always succeeds
      const mockResponse: SendCodeResponse = {
        message: "Verification code sent successfully!"
      };
      debugLog.auth('Mock magic code response', mockResponse);
      return mockResponse;
    }
    
    const response = await api.post<SendCodeResponse>('/api/education/auth/send-code', { email });
    debugLog.auth('Magic code response', response.data);
    return response.data;
  },

  // Verify code and login
  login: async (email: string, code: string): Promise<LoginResponse> => {
    debugLog.auth('Login attempt', { email, code: '***' });
    
    if (config.MOCK_APIS) {
      // Mock response - always succeeds
      const mockToken = 'mock-jwt-token-' + Date.now();
      const mockResponse: LoginResponse = {
        access_token: mockToken,
        token_type: 'Bearer',
        is_new_user: false,
        message: 'Login successful!',
        user_data: config.MOCK_USER
      };
      
      // Store the mock token
      tokenManager.setToken(mockToken);
      debugLog.auth('Mock login response', {
        access_token: '***MOCK_TOKEN***',
        token_type: mockResponse.token_type,
        is_new_user: mockResponse.is_new_user,
        message: mockResponse.message,
        user_data: mockResponse.user_data
      });
      
      return mockResponse;
    }
    
    const response = await api.post<LoginResponse>('/api/education/auth/login', { 
      email, 
      code 
    });
    
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
  getCurrentUser: async (): Promise<User> => {
    if (config.MOCK_APIS) {
      // Mock response - return mock user data
      debugLog.user('Mock current user data', config.MOCK_USER);
      return config.MOCK_USER;
    }
    
    const response = await api.get<User>('/api/education/auth/me');
    
    // Debug: Log the user data
    debugLog.user('Current user data', response.data);
    
    return response.data;
  },
  // Logout
  logout: async (): Promise<LogoutResponse> => {
    try {
      debugLog.auth('Logout attempt');
      
      if (config.MOCK_APIS) {
        // Mock response - always succeeds
        const mockResponse: LogoutResponse = {
          message: "Logout successful"
        };
        debugLog.auth('Mock logout response', mockResponse);
        return mockResponse;
      }
      
      const response = await api.post<LogoutResponse>('/api/education/auth/logout');
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
  refreshToken: async (): Promise<string> => {
    debugLog.auth('Refreshing token');
    
    if (config.MOCK_APIS) {
      // Mock response - generate new mock token
      const newMockToken = 'mock-jwt-token-refreshed-' + Date.now();
      tokenManager.setToken(newMockToken);
      debugLog.auth('Mock token refreshed successfully');
      return newMockToken;
    }
    
    const response = await api.post<{ access_token: string }>('/api/education/auth/refresh');
    const newToken = response.data.access_token;
    tokenManager.setToken(newToken);
    debugLog.auth('Token refreshed successfully');
    return newToken;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!tokenManager.getToken();
  },
};
