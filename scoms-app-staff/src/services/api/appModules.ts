import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient, setModuleHiddenHandler } from './client';
import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';
import { ApiEnvelope } from '../../types/api';
import { EnabledModule } from '../../types/auth';
import { useAuth } from '../../store/AuthContext';
import { LEGACY_REQUIRES, ModuleKey } from '../../navigation/moduleKeys';

/**
 * GET /app-modules: which Staff App modules this staff member sees (Super Admin →
 * Institutions → App Module Access → Staff App, combined with the institution's modules
 * and the role). Catalog: shared/appModules/catalog.js STAFF_APP_MODULES.
 */
export interface AppModule {
  key: string;
  label: string;
  group: string;
  visible: boolean;
  reason: 'NOT_FOR_ROLE' | 'INSTITUTION_MODULE_DISABLED' | 'HIDDEN_BY_SUPER_ADMIN' | 'NO_INSTITUTION' | null;
}

async function fetchAppModules(): Promise<AppModule[]> {
  const { data } = await apiClient.get<ApiEnvelope<{ modules: AppModule[] }>>('/app-modules');
  return data.data.modules;
}

/** Re-load the list, e.g. after the gateway answered 403 APP_MODULE_HIDDEN. */
export const refreshAppModules = () => queryClient.invalidateQueries({ queryKey: queryKeys.appModules });
setModuleHiddenHandler(() => {
  refreshAppModules();
});

function institutionHas(enabledModules: EnabledModule[] | string[] | undefined, key: string): boolean {
  if (!enabledModules) return true; // legacy institutions with no explicit list
  return enabledModules.some((m) => (typeof m === 'string' ? m === key : m.key === key && m.enabled));
}

/**
 * `isVisible(key)`: whether Super Admin shows that module to this user.
 *  - list loaded → the server's answer (role + institution + Super Admin);
 *  - list failed (older gateway) → the institution's enabledModules from /auth/me;
 *  - still loading → true, so the first paint isn't empty (the screens are gated again
 *    once the list arrives, and the server enforces it regardless).
 */
export function useAppModules() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.appModules,
    queryFn: fetchAppModules,
    staleTime: 5 * 60_000,
    enabled: !!user,
  });
  const modules = query.data;
  const enabledModules = user?.institution?.enabledModules;
  const failed = !modules && query.isError;

  const isVisible = useCallback(
    (key: string) => {
      if (modules) return modules.find((m) => m.key === key)?.visible ?? false;
      if (failed) {
        const req = LEGACY_REQUIRES[key as ModuleKey];
        return req === undefined || req === null || institutionHas(enabledModules, req);
      }
      return true;
    },
    [modules, failed, enabledModules],
  );
  return { modules, isVisible, isLoading: query.isLoading, refetch: query.refetch };
}

/** Re-load the list whenever the app returns to the foreground, so a Super Admin change
 * shows without re-login. Mount once (MainTabNavigator). */
export function useRefreshAppModulesOnForeground() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshAppModules();
    });
    return () => sub.remove();
  }, []);
}
