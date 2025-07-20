import api from './api';
import { debugLog } from '../utils/debug';
import { config } from '../utils/mockConfig';

export interface User {
  user_id: string;
  email: string;
  username: string;
  profile_picture?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserCredits {
  current_balance: number;
  total_purchased: number;
  total_used: number;
}

export interface UserPreferences {
  default_level: 'beginner' | 'intermediate' | 'advanced';
  default_study_time: '30min' | '60min' | '90min';
}

export interface EducationUserAppData {
  user_id: string;
  user_credits: UserCredits;
  user_preferences: UserPreferences;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  profile_picture?: string | null;
}

export interface UpdateUserRequest {
  username?: string;
  profile_picture?: string | null;
}

export interface CreateEducationAppDataRequest {
  user_id: string;
  user_credits?: UserCredits;
  user_preferences?: UserPreferences;
}

export interface UpdateEducationAppDataRequest {
  user_credits?: UserCredits;
  user_preferences?: UserPreferences;
}

export const userService = {
  // Get user by ID
  getUserById: async (userId: string): Promise<User> => {
    try {
      debugLog.user('Getting user by ID', { userId });
      const response = await api.get<User>(`/api/education/users/${userId}`);
      debugLog.user('User data retrieved', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to get user by ID', error);
      throw error;
    }
  },

  // Get user by email
  getUserByEmail: async (email: string): Promise<User> => {
    try {
      debugLog.user('Getting user by email', { email });
      const response = await api.get<User>(`/api/education/users?email=${encodeURIComponent(email)}`);
      debugLog.user('User data retrieved by email', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to get user by email', error);
      throw error;
    }
  },

  // Create user
  createUser: async (userData: CreateUserRequest): Promise<User> => {
    try {
      debugLog.user('Creating user', userData);
      const response = await api.post<User>('/api/education/users', userData);
      debugLog.user('User created successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to create user', error);
      throw error;
    }
  },

  // Update user
  updateUser: async (userId: string, userData: UpdateUserRequest): Promise<User> => {
    try {
      debugLog.user('Updating user', { userId, userData });
      const response = await api.put<User>(`/api/education/users/${userId}`, userData);
      debugLog.user('User updated successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to update user', error);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId: string): Promise<{ message: string }> => {
    try {
      debugLog.user('Deleting user', { userId });
      const response = await api.delete<{ message: string }>(`/api/education/users/${userId}`);
      debugLog.user('User deleted successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to delete user', error);
      throw error;
    }
  }
};

export const educationUserService = {  // Get education user app data
  getEducationUserAppData: async (userId: string): Promise<EducationUserAppData> => {
    try {
      debugLog.user('Getting education user app data', { userId });
      
      if (config.MOCK_APIS) {
        // Mock response - return mock education app data
        const mockAppData: EducationUserAppData = {
          user_id: userId,
          user_credits: config.MOCK_CREDITS,
          user_preferences: config.MOCK_PREFERENCES
        };
        debugLog.user('Mock education app data retrieved', mockAppData);
        return mockAppData;
      }
      
      const response = await api.get<EducationUserAppData>(`/api/education/user-app-data/${userId}`);
      debugLog.user('Education app data retrieved', response.data);
      return response.data;
    } catch (error) {
      debugLog.warn('Education app data not found, using defaults', error);
      // Return default data if not found
      const defaultData: EducationUserAppData = {
        user_id: userId,
        user_credits: config.MOCK_APIS ? config.MOCK_CREDITS : {
          current_balance: 0,
          total_purchased: 0,
          total_used: 0
        },
        user_preferences: config.MOCK_APIS ? config.MOCK_PREFERENCES : {
          default_level: 'beginner',
          default_study_time: '30min'
        }
      };
      debugLog.user('Using default education app data', defaultData);
      return defaultData;
    }
  },

  // Create education user app data
  createEducationUserAppData: async (appData: CreateEducationAppDataRequest): Promise<EducationUserAppData> => {
    try {
      debugLog.user('Creating education user app data', appData);
      const response = await api.post<EducationUserAppData>('/api/education/user-app-data', appData);
      debugLog.user('Education app data created successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to create education app data', error);
      throw error;
    }
  },

  // Update education user app data
  updateEducationUserAppData: async (userId: string, appData: UpdateEducationAppDataRequest): Promise<EducationUserAppData> => {
    try {
      debugLog.user('Updating education user app data', { userId, appData });
      const response = await api.put<EducationUserAppData>(`/api/education/user-app-data/${userId}`, appData);
      debugLog.user('Education app data updated successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to update education app data', error);
      throw error;
    }
  },

  // Ensure education user app data exists
  ensureEducationUserAppData: async (userId: string): Promise<EducationUserAppData> => {
    try {
      debugLog.user('Ensuring education user app data exists', { userId });
      const response = await api.post<EducationUserAppData>(`/api/education/user-app-data/${userId}/ensure`);
      debugLog.user('Education app data ensured', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to ensure education app data', error);
      throw error;
    }
  },
  // Add credits
  addCredits: async (userId: string, amount: number): Promise<EducationUserAppData> => {
    try {
      debugLog.credits('Adding credits', { userId, amount });
      
      if (config.MOCK_APIS) {
        // Mock response - simulate adding credits
        const updatedCredits = {
          current_balance: config.MOCK_CREDITS.current_balance + amount,
          total_purchased: config.MOCK_CREDITS.total_purchased + amount,
          total_used: config.MOCK_CREDITS.total_used
        };
        // Update the mock config for consistency
        config.MOCK_CREDITS.current_balance = updatedCredits.current_balance;
        config.MOCK_CREDITS.total_purchased = updatedCredits.total_purchased;
        
        const mockResponse: EducationUserAppData = {
          user_id: userId,
          user_credits: updatedCredits,
          user_preferences: config.MOCK_PREFERENCES
        };
        debugLog.credits('Mock credits added successfully', mockResponse);
        return mockResponse;
      }
      
      const response = await api.post<EducationUserAppData>(`/api/education/user-app-data/${userId}/credits/add?amount=${amount}`);
      debugLog.credits('Credits added successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to add credits', error);
      throw error;
    }
  },

  // Use credits
  useCredits: async (userId: string, amount: number): Promise<EducationUserAppData> => {
    try {
      debugLog.credits('Using credits', { userId, amount });
      
      if (config.MOCK_APIS) {
        // Mock response - simulate using credits
        const updatedCredits = {
          current_balance: Math.max(0, config.MOCK_CREDITS.current_balance - amount),
          total_purchased: config.MOCK_CREDITS.total_purchased,
          total_used: config.MOCK_CREDITS.total_used + amount
        };
        // Update the mock config for consistency
        config.MOCK_CREDITS.current_balance = updatedCredits.current_balance;
        config.MOCK_CREDITS.total_used = updatedCredits.total_used;
        
        const mockResponse: EducationUserAppData = {
          user_id: userId,
          user_credits: updatedCredits,
          user_preferences: config.MOCK_PREFERENCES
        };
        debugLog.credits('Mock credits used successfully', mockResponse);
        return mockResponse;
      }
      
      const response = await api.post<EducationUserAppData>(`/api/education/user-app-data/${userId}/credits/use?amount=${amount}`);
      debugLog.credits('Credits used successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to use credits', error);
      throw error;
    }
  },

  // Update credits directly
  updateCredits: async (userId: string, credits: UserCredits): Promise<EducationUserAppData> => {
    try {
      debugLog.credits('Updating credits directly', { userId, credits });
      const response = await api.put<EducationUserAppData>(`/api/education/user-app-data/${userId}/credits`, credits);
      debugLog.credits('Credits updated successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to update credits', error);
      throw error;
    }
  },

  // Update preferences
  updatePreferences: async (userId: string, preferences: UserPreferences): Promise<EducationUserAppData> => {
    try {
      debugLog.user('Updating user preferences', { userId, preferences });
      const response = await api.put<EducationUserAppData>(`/api/education/user-app-data/${userId}/preferences`, preferences);
      debugLog.user('Preferences updated successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to update preferences', error);
      throw error;
    }
  }
};
