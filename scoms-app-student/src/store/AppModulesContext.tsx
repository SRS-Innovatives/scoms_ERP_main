/**
 * Which app modules the logged-in user can see, from GET /app-modules (Super Admin →
 * Institutions → App Module Access, combined server-side with the institution's own
 * modules and the user's role). Navigation, the More menu and dashboard widgets all read
 * isVisible() from here — nothing else decides what's shown.
 *
 * Refreshed when the app returns to the foreground and whenever the gateway answers
 * 403 APP_MODULE_HIDDEN, so a Super Admin change shows up without a re-login.
 *
 * Display-only: the gateway independently blocks hidden modules (requireAppModule).
 * If /app-modules can't be loaded (e.g. an older gateway without it), visibility falls
 * back to the institution's enabledModules from /auth/me, the pre-Phase-1 behaviour.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { useParent } from './ParentContext';
import { setModuleHiddenHandler } from '../services/api/client';
import { fetchAppModules } from '../modules/appModules/services/appModulesService';
import { AppModule } from '../types/appModules';
import { AuthUser } from '../types/auth';
import { LEGACY_REQUIRES, PARENT_ONLY_KEYS } from '../navigation/moduleKeys';

interface AppModulesContextValue {
  modules: AppModule[];
  /** True once the list loaded, or failed and we're on the legacy fallback. */
  isReady: boolean;
  isVisible: (key: string) => boolean;
  refresh: () => void;
}

const AppModulesContext = createContext<AppModulesContextValue | undefined>(undefined);

function legacyVisible(user: AuthUser | null, key: string): boolean {
  if (PARENT_ONLY_KEYS.includes(key) && user?.role !== 'PARENT') return false;
  const requires = LEGACY_REQUIRES[key];
  if (requires === undefined || requires === null) return true;
  const enabled = user?.institution?.enabledModules;
  if (!enabled) return true;
  return enabled.some((m: any) => (typeof m === 'string' ? m === requires : m.key === requires && m.enabled));
}

export function AppModulesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { status: parentStatus } = useParent();
  // A parent's requests carry the active child — wait until that's settled
  const canFetch = !!user && (parentStatus === 'not-parent' || parentStatus === 'ready');

  const query = useQuery({
    queryKey: ['appModules', user?.id],
    queryFn: fetchAppModules,
    enabled: canFetch,
    staleTime: 30_000,
    retry: 1,
  });
  const { refetch } = query;

  const refresh = useCallback(() => {
    if (canFetch) refetch();
  }, [canFetch, refetch]);

  useEffect(() => {
    setModuleHiddenHandler(refresh);
    return () => setModuleHiddenHandler(null);
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const value = useMemo<AppModulesContextValue>(() => {
    const modules = query.data?.modules ?? [];
    const byKey = new Map(modules.map((m) => [m.key, m]));
    const useLegacy = !query.data && query.isError;
    return {
      modules,
      isReady: !user || !!query.data || query.isError,
      isVisible: (key: string) => {
        if (useLegacy) return legacyVisible(user, key);
        return byKey.get(key)?.visible ?? false;
      },
      refresh,
    };
  }, [query.data, query.isError, user, refresh]);

  return <AppModulesContext.Provider value={value}>{children}</AppModulesContext.Provider>;
}

export function useAppModules(): AppModulesContextValue {
  const ctx = useContext(AppModulesContext);
  if (!ctx) throw new Error('useAppModules must be used within AppModulesProvider');
  return ctx;
}
