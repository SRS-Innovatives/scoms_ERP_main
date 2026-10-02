import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearTokens, getTokens, saveTokens } from '../utils/secureStorage';
import { setSessionExpiredHandler } from '../services/api/client';
import { fetchMe, login as loginRequest, logout as logoutRequest } from '../modules/auth/services/authService';
import { AuthUser } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const forceLogout = useCallback(async () => {
    await clearTokens();
    setUser(null);
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(forceLogout);
  }, [forceLogout]);

  useEffect(() => {
    (async () => {
      const tokens = await getTokens();
      if (tokens?.accessToken) {
        try {
          const me = await fetchMe();
          setUser(me);
        } catch {
          await clearTokens();
        }
      }
      setIsBootstrapping(false);
    })();
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const result = await loginRequest(identifier, password);
    await saveTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    const tokens = await getTokens();
    if (tokens?.refreshToken) {
      await logoutRequest(tokens.refreshToken).catch(() => {});
    }
    await clearTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await fetchMe();
    setUser(me);
  }, []);

  const value = useMemo(
    () => ({ user, isBootstrapping, isAuthenticated: !!user, login, logout, refreshUser }),
    [user, isBootstrapping, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
