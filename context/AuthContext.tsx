"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { authService, User } from "../services/authService";
import { userService } from "../services/userService";
import initializationService from "../services/initializationService";

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
          console.log('🔄 [AuthContext] Initializing session with combined endpoint...');
          const startTime = performance.now();
          
          // Single API call gets everything
          const initData = await initializationService.initializeSession();
          
          const endTime = performance.now();
          console.log(`✅ [AuthContext] Session initialized in ${(endTime - startTime).toFixed(0)}ms`);
          
          // Set all state at once
          setUser(initData.user as unknown as User);
          setIsNewUser(initData.is_new_user);
          
          // Set preferences from user data
          if (initData.user.preferences) {
            const prefs = initData.user.preferences;
            setUserPreferences({
              default_level: prefs.default_level || 'CE2',
              default_domain: prefs.default_domain || 'tous',
              default_period: prefs.default_period || '20 min'
            });
          }
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
      console.log('🔐 [AuthContext] Logging in...');
      
      // Step 1: Authenticate and get token
      const loginResponse = await authService.login(email, code);
      const token = loginResponse.access_token;
      
      console.log('🔄 [AuthContext] Initializing session with combined endpoint...');
      const startTime = performance.now();
      
      // Step 2: Initialize everything with single API call
      const initData = await initializationService.initializeSession(token);
      
      const endTime = performance.now();
      console.log(`✅ [AuthContext] Session initialized in ${(endTime - startTime).toFixed(0)}ms`);
      
      // Step 3: Set all state at once
      setUser(initData.user as unknown as User);
      setIsNewUser(initData.is_new_user);
      
      // Set preferences from user data
      if (initData.user.preferences) {
        const prefs = initData.user.preferences;
        setUserPreferences({
          default_level: prefs.default_level || 'CE2',
          default_domain: prefs.default_domain || 'tous',
          default_period: prefs.default_period || '20 min'
        });
      }
      
      return { 
        success: true, 
        isNewUser: initData.is_new_user, 
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
      
      // Clear initialization cache
      initializationService.clearInitCache();
      
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
      
      // Clear cache even on error
      initializationService.clearInitCache();
      
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
