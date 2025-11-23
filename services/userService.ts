import api from './api';
import { debugLog } from '../utils/debug';
import { config } from '../utils/mockConfig';

// ===== INTERFACES SYNCHRONISÉES AVEC LE BACKEND =====

export interface UserModel {
  id?: string | null;
  user_id: string; // Business-level user ID (email), also used as partition key
  email: string;
  username: string;
  user_preferences?: {
    default_level?: string;
    default_domain?: string;
    default_period?: string;
  };
  app_settings?: any;
  feature_flags?: any;
  metadata?: any;
  updated_at?: string;
  last_login?: string;
}

export interface UserCreate {
  email: string;
  username: string;
}

export interface UserUpdate {
  username?: string | null;
  user_preferences?: {
    default_level?: string;
    default_domain?: string;
    default_period?: string;
  };
  app_settings?: any;
  feature_flags?: any;
  metadata?: any;
}

export interface AppCredits {
  current_balance?: number;
  total_purchased?: number;
  total_used?: number;
}

export interface AppPreferences {
  default_level?: string;
  default_study_time?: string;
}

export interface AppData {
  user_id: string;
  user_credits?: AppCredits;
  user_preferences?: AppPreferences;
}

export interface AppDataCreate {
  user_id: string;
  user_credits?: AppCredits | null;
  user_preferences?: AppPreferences | null;
}

export interface AppDataUpdate {
  user_credits?: AppCredits | null;
  user_preferences?: AppPreferences | null;
}

// ===== LEGACY INTERFACES (pour compatibilité) =====
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
  // Get user by ID - Synchronisé avec backend
  getUserById: async (userId: string): Promise<UserModel> => {
    try {
      debugLog.user('Getting user by ID', { userId });
      const response = await api.get<UserModel>(`/api/users/${userId}`);
      debugLog.user('User data retrieved', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to get user by ID', error);
      throw error;
    }
  },

  // Get current user - Synchronisé avec backend
  getCurrentUser: async (): Promise<UserModel> => {
    try {
      debugLog.user('Getting current user');
      const response = await api.get<UserModel>('/api/users/me');
      debugLog.user('Current user data retrieved', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to get current user', error);
      throw error;
    }
  },

  // Create user - Synchronisé avec backend
  createUser: async (userData: UserCreate): Promise<UserModel> => {
    try {
      debugLog.user('Creating user', userData);
      const response = await api.post<UserModel>('/api/users', userData);
      debugLog.user('User created successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to create user', error);
      throw error;
    }
  },

  // Update user - Synchronisé avec backend
  updateUser: async (userId: string, userData: UserUpdate): Promise<UserModel> => {
    try {
      debugLog.user('Updating user', { userId, userData });
      const response = await api.put<UserModel>(`/api/users/${userId}`, userData);
      debugLog.user('User updated successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to update user', error);
      throw error;
    }
  },

  // Delete user - Synchronisé avec backend
  deleteUser: async (userId: string): Promise<{ message: string }> => {
    try {
      debugLog.user('Deleting user', { userId });
      const response = await api.delete<{ message: string }>(`/api/users/${userId}`);
      debugLog.user('User deleted successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to delete user', error);
      throw error;
    }
  },

  // Get user with preferences - Uses GET /api/users/{user_id}
  getUserWithPreferences: async (userId: string): Promise<UserModel> => {
    try {
      debugLog.user('Getting user with preferences', { userId });
      const response = await api.get<UserModel>(`/api/users/${userId}`);
      debugLog.user('User data with preferences retrieved', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to get user with preferences', error);
      throw error;
    }
  },

  // Update user preferences - Uses PUT /api/users/{user_id} with user_preferences field
  updateUserPreferences: async (userId: string, preferences: { default_level?: string; default_domain?: string; default_period?: string }): Promise<UserModel> => {
    try {
      debugLog.user('Updating user preferences', { userId, preferences });
      const response = await api.put<UserModel>(`/api/users/${userId}`, {
        user_preferences: preferences
      });
      debugLog.user('User preferences updated successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to update user preferences', error);
      throw error;
    }
  },

  // ===== LEGACY METHODS (pour compatibilité avec l'ancien code) =====
  getUserByEmail: async (email: string): Promise<User> => {
    try {
      debugLog.user('Getting user by email (legacy)', { email });
      // Note: Le backend n'expose pas directement cette méthode, 
      // utiliser getCurrentUser() si c'est l'utilisateur connecté
      const response = await api.get<User>(`/api/users/by-email?email=${encodeURIComponent(email)}`);
      debugLog.user('User data retrieved by email', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to get user by email', error);
      throw error;
    }
  }
};

export const educationUserService = {
  // Get education app data - Synchronisé avec backend
  getAppData: async (userId: string): Promise<AppData> => {
    try {
      debugLog.user('Getting education app data', { userId });
      
      if (config.MOCK_APIS) {
        // Mock response - return mock education app data
        const mockAppData: AppData = {
          user_id: userId,
          user_credits: config.MOCK_CREDITS,
          user_preferences: config.MOCK_PREFERENCES
        };
        debugLog.user('Mock education app data retrieved', mockAppData);
        return mockAppData;
      }
      
      const response = await api.get<AppData>(`/api/education/app-data/${userId}`);
      debugLog.user('Education app data retrieved', response.data);
      return response.data;
    } catch (error) {
      debugLog.warn('Education app data not found, using defaults', error);
      // Return default data if not found
      const defaultData: AppData = {
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

  // Create education app data - Synchronisé avec backend
  createAppData: async (appData: AppDataCreate): Promise<AppData> => {
    try {
      debugLog.user('Creating education app data', appData);
      const response = await api.post<AppData>('/api/education/app-data', appData);
      debugLog.user('Education app data created successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to create education app data', error);
      throw error;
    }
  },

  // Update education app data - Synchronisé avec backend
  updateAppData: async (userId: string, appData: AppDataUpdate): Promise<AppData> => {
    try {
      debugLog.user('Updating education app data', { userId, appData });
      const response = await api.put<AppData>(`/api/education/app-data/${userId}`, appData);
      debugLog.user('Education app data updated successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to update education app data', error);
      throw error;
    }
  },

  // Delete education app data - Synchronisé avec backend
  deleteAppData: async (userId: string): Promise<{ message: string }> => {
    try {
      debugLog.user('Deleting education app data', { userId });
      const response = await api.delete<{ message: string }>(`/api/education/app-data/${userId}`);
      debugLog.user('Education app data deleted successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to delete education app data', error);
      throw error;
    }
  },

  // ===== LEGACY METHODS (pour compatibilité avec l'ancien code) =====
  getEducationUserAppData: async (userId: string): Promise<EducationUserAppData> => {
    try {
      const appData = await educationUserService.getAppData(userId);
      // Convertir vers l'ancien format
      return {
        user_id: appData.user_id,
        user_credits: appData.user_credits as UserCredits,
        user_preferences: appData.user_preferences as UserPreferences
      };
    } catch (error) {
      debugLog.error('Failed to get legacy education app data', error);
      throw error;
    }
  },

  createEducationUserAppData: async (appData: CreateEducationAppDataRequest): Promise<EducationUserAppData> => {
    try {
      const newAppData = await educationUserService.createAppData({
        user_id: appData.user_id,
        user_credits: appData.user_credits,
        user_preferences: appData.user_preferences
      });
      return {
        user_id: newAppData.user_id,
        user_credits: newAppData.user_credits as UserCredits,
        user_preferences: newAppData.user_preferences as UserPreferences
      };
    } catch (error) {
      debugLog.error('Failed to create legacy education app data', error);
      throw error;
    }
  },

  updateEducationUserAppData: async (userId: string, appData: UpdateEducationAppDataRequest): Promise<EducationUserAppData> => {
    try {
      const updatedAppData = await educationUserService.updateAppData(userId, {
        user_credits: appData.user_credits,
        user_preferences: appData.user_preferences
      });
      return {
        user_id: updatedAppData.user_id,
        user_credits: updatedAppData.user_credits as UserCredits,
        user_preferences: updatedAppData.user_preferences as UserPreferences
      };
    } catch (error) {
      debugLog.error('Failed to update legacy education app data', error);
      throw error;
    }
  },

  ensureEducationUserAppData: async (userId: string): Promise<EducationUserAppData> => {
    try {
      debugLog.user('Ensuring education user app data exists', { userId });
      // Tenter de récupérer les données existantes
      const existingData = await educationUserService.getAppData(userId);
      return {
        user_id: existingData.user_id,
        user_credits: existingData.user_credits as UserCredits,
        user_preferences: existingData.user_preferences as UserPreferences
      };
    } catch (error) {
      // Si les données n'existent pas, les créer
      debugLog.user('Creating default education app data', { userId });
      const defaultData: AppDataCreate = {
        user_id: userId,
        user_credits: {
          current_balance: 0,
          total_purchased: 0,
          total_used: 0
        },
        user_preferences: {
          default_level: 'beginner',
          default_study_time: '30min'
        }
      };
      const newData = await educationUserService.createAppData(defaultData);
      return {
        user_id: newData.user_id,
        user_credits: newData.user_credits as UserCredits,
        user_preferences: newData.user_preferences as UserPreferences
      };
    }
  },
  // Add credits - Synchronisé avec backend
  addCredits: async (userId: string, amount: number): Promise<AppData> => {
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
        
        const mockResponse: AppData = {
          user_id: userId,
          user_credits: updatedCredits,
          user_preferences: config.MOCK_PREFERENCES
        };
        debugLog.credits('Mock credits added successfully', mockResponse);
        return mockResponse;
      }
      
      const response = await api.post<AppData>(`/api/education/app-data/${userId}/credits/add`, null, {
        params: { amount }
      });
      debugLog.credits('Credits added successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to add credits', error);
      throw error;
    }
  },

  // Use credits - Synchronisé avec backend
  useCredits: async (userId: string, amount: number): Promise<AppData> => {
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
        
        const mockResponse: AppData = {
          user_id: userId,
          user_credits: updatedCredits,
          user_preferences: config.MOCK_PREFERENCES
        };
        debugLog.credits('Mock credits used successfully', mockResponse);
        return mockResponse;
      }
      
      const response = await api.post<AppData>(`/api/education/app-data/${userId}/credits/use`, null, {
        params: { amount }
      });
      debugLog.credits('Credits used successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to use credits', error);
      throw error;
    }
  },

  // Update credits directly - Synchronisé avec backend
  updateCredits: async (userId: string, credits: AppCredits): Promise<AppData> => {
    try {
      debugLog.credits('Updating credits directly', { userId, credits });
      const response = await api.put<AppData>(`/api/education/app-data/${userId}/credits`, credits);
      debugLog.credits('Credits updated successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to update credits', error);
      throw error;
    }
  },

  // Update preferences - Synchronisé avec backend
  updatePreferences: async (userId: string, preferences: AppPreferences): Promise<AppData> => {
    try {
      debugLog.user('Updating user preferences', { userId, preferences });
      const response = await api.put<AppData>(`/api/education/app-data/${userId}/preferences`, preferences);
      debugLog.user('Preferences updated successfully', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to update preferences', error);
      throw error;
    }
  }
};
