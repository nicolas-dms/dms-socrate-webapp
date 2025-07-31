"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { authService, User } from "../services/authService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean | null;
  login: (email: string, code: string) => Promise<{ success: boolean; isNewUser?: boolean; message?: string }>;
  sendMagicCode: (email: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Try to get current user info
          const userData = await authService.getCurrentUser();
          setUser(userData);
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
      const loginResponse = await authService.login(email, code);
      setUser(loginResponse.user_data as User);
      setIsNewUser(loginResponse.is_new_user);
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
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear user state even if backend call fails
      setUser(null);
      setIsNewUser(null);
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

  const isAuthenticated = !!user && authService.isAuthenticated();

  return (    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated,
      isNewUser,
      login, 
      sendMagicCode,
      logout,
      refreshUser 
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
