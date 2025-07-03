"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

interface User {
  username: string;
  // Add more user fields as needed
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, code: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Optionally, check for existing session on mount
  useEffect(() => {
    // Example: check localStorage or call FastAPI /me endpoint
    // setUser(...)
  }, []);

  const login = async (email: string, code: string) => {
    setLoading(true);
    // Mock: always succeed
    await new Promise((res) => setTimeout(res, 700));
    setUser({ username: email });
    setLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    // Remove token/session as needed
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
