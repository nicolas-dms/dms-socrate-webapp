"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { authService, User } from "../services/authService";
import { userService } from "../services/userService";

interface UserPreferences {
  default_level: string;
  default_domain: string;
  default_period: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean | null;
  userPreferences: UserPreferences;
  login: (email: string, code: string) => Promise<{ success: boolean; isNewUser?: boolean; message?: string }>;
  sendMagicCode: (email: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    default_level: 'CE2',
    default_domain: 'tous',
    default_period: '20 min'
  });

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Try to get current user info
          const userData = await authService.getCurrentUser();
          setUser(userData);
          
          // Load user preferences
          await loadUserPreferences(userData.email);
          
          // Check if user is new by counting their files
          await checkIfNewUser(userData.user_id);
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        // Clear invalid token
        await authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Function to load user preferences
  const loadUserPreferences = async (email: string): Promise<void> => {
    try {
      console.log('👤 [AuthContext] Loading user preferences...');
      const userData = await userService.getUserWithPreferences(email);
      
      if (userData.user_preferences) {
        const prefs = userData.user_preferences;
        const newPrefs = {
          default_level: prefs.default_level || 'CE2',
          default_domain: prefs.default_domain || 'tous',
          default_period: prefs.default_period || '20 min'
        };
        setUserPreferences(newPrefs);
        console.log('✅ [AuthContext] User preferences loaded:', newPrefs);
        
        // Auto-save default preferences if any are missing
        if (!prefs.default_level || !prefs.default_domain || !prefs.default_period) {
          console.log('🔄 [AuthContext] Auto-saving default preferences...');
          await userService.updateUserPreferences(email, newPrefs);
        }
      } else {
        // No preferences - create defaults
        console.log('🔄 [AuthContext] Creating default preferences...');
        const defaultPrefs = {
          default_level: 'CE2',
          default_domain: 'tous',
          default_period: '20 min'
        };
        await userService.updateUserPreferences(email, defaultPrefs);
        setUserPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('❌ [AuthContext] Failed to load user preferences:', error);
      // Keep default values on error
    }
  };

  // Function to check if user has less than 2 files
  const checkIfNewUser = async (userId: string): Promise<void> => {
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const encodedUserId = encodeURIComponent(userId);
      const response = await fetch(
        `${baseURL}/api/education/exercises/files/${encodedUserId}/count?active_only=false`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const fileCount = data.total_count || 0;
        
        // User is considered "new" if they have less than 2 files
        const isNew = fileCount < 2;
        setIsNewUser(isNew);
        
        console.log(`✅ User file count: ${fileCount}, isNewUser: ${isNew}`);
      } else {
        console.warn('⚠️ Failed to fetch file count, defaulting isNewUser to null');
        setIsNewUser(null);
      }
    } catch (error) {
      console.error('❌ Error checking new user status:', error);
      setIsNewUser(null);
    }
  };

  const sendMagicCode = async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setLoading(true);
      const response = await authService.sendMagicCode(email);
      return { success: true, message: response.message };
    } catch (error: any) {
      console.error("Failed to send magic code:", error);
      return { 
        success: false, 
        message: error.response?.data?.detail || error.message || "Failed to send verification code" 
      };
    } finally {
      setLoading(false);
    }
  };
  const login = async (email: string, code: string): Promise<{ success: boolean; isNewUser?: boolean; message?: string }> => {
    try {
      setLoading(true);
      const loginResponse = await authService.login(email, code);
      setUser(loginResponse.user_data as User);
      
      // Log user data structure to debug
      console.log('📊 Login response user_data:', loginResponse.user_data);
      
      // Load user preferences immediately after login
      await loadUserPreferences(email);
      
      // Check file count to determine if user is new
      // Try multiple possible user ID fields
      const userId = loginResponse.user_data?.user_id 
        || loginResponse.user_data?.id 
        || loginResponse.user_data?.email;
      
      if (userId) {
        console.log('🔑 Using user ID for file count check:', userId);
        await checkIfNewUser(userId);
      } else {
        console.warn('⚠️ No user ID found in login response, using backend is_new_user flag');
        // Fallback to backend's is_new_user flag if available
        setIsNewUser(loginResponse.is_new_user || false);
      }
      
      // Important: Keep loading state until subscription data is ready
      // The SubscriptionContext will load in parallel via its useEffect
      // Wait a brief moment to allow subscription context to initialize
      console.log('✅ Login successful, waiting for subscription context to load...');
      
      return { 
        success: true, 
        isNewUser: loginResponse.is_new_user, 
        message: loginResponse.message 
      };
    } catch (error: any) {
      console.error("Login failed:", error);
      return { 
        success: false, 
        message: error.response?.data?.detail || error.message || "Login failed" 
      };
    } finally {
      setLoading(false);
    }
  };
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      const result = await authService.logout();
      console.log('Logout successful:', result.message);
      setUser(null);
      setIsNewUser(null);
      // Reset preferences to defaults
      setUserPreferences({
        default_level: 'CE2',
        default_domain: 'tous',
        default_period: '20 min'
      });
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear user state even if backend call fails
      setUser(null);
      setIsNewUser(null);
      setUserPreferences({
        default_level: 'CE2',
        default_domain: 'tous',
        default_period: '20 min'
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      if (authService.isAuthenticated()) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      // If refresh fails, user might need to login again
      setUser(null);
    }
  };

  const updateUserPreferences = async (prefs: Partial<UserPreferences>): Promise<void> => {
    if (!user?.email) throw new Error('User not authenticated');
    
    try {
      // Merge with existing preferences
      const updatedPrefs = { ...userPreferences, ...prefs };
      
      // Update backend
      await userService.updateUserPreferences(user.email, updatedPrefs);
      
      // Update local state immediately
      setUserPreferences(updatedPrefs);
      console.log('✅ [AuthContext] User preferences updated:', updatedPrefs);
    } catch (error) {
      console.error('❌ [AuthContext] Failed to update preferences:', error);
      throw error;
    }
  };

  const isAuthenticated = !!user && authService.isAuthenticated();

  return (    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated,
      isNewUser,
      userPreferences,
      login, 
      sendMagicCode,
      logout,
      refreshUser,
      updateUserPreferences 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
