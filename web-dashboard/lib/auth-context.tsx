"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, UserSession } from "./api";

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  login: (role: string, adminKey?: string, abhaId?: string, name?: string) => Promise<void>;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // Sync initial state from api client
    setUser(api.getUser());

    // Listen for auth state changes
    const unsubscribe = api.onAuthChange((newUser) => {
      setUser(newUser);
    });

    // Auto-login with default dev Hospital Admin if no session exists yet (seamless pairs programming)
    if (!api.getToken()) {
      api.login("HOSPITAL_ADMIN")
        .then(({ user }) => {
          setUser(user);
        })
        .catch((err) => {
          console.log("[Dev Auto-Auth] Gateway offline or auth not ready:", err.message);
        });
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (role: string, adminKey?: string, abhaId?: string, name?: string) => {
    const res = await api.login(role, adminKey, abhaId, name);
    setUser(res.user);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
