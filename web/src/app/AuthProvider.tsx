import React, { createContext, useCallback, useContext, useState } from 'react';
import { authService, AuthUser, session } from '../services/api';

interface AuthState {
  user: AuthUser | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => session.load());

  const login = useCallback((u: AuthUser, token: string) => {
    session.save(u, token);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    void authService.logout();
    session.clear();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
