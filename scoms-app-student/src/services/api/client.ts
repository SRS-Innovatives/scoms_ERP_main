import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../../constants/config';
import { clearTokens, getTokens, saveTokens } from '../../utils/secureStorage';

/** Fired on unrecoverable auth failure (refresh failed) so the auth store can force logout. */
type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;
export function setSessionExpiredHandler(handler: SessionExpiredHandler): void {
  onSessionExpired = handler;
}

/** Fired when the gateway answers 403 APP_MODULE_HIDDEN — Super Admin hid a module while the
 * app was open, so the module list is stale and must be re-fetched (navigation then drops it). */
type ModuleHiddenHandler = () => void;
let onModuleHidden: ModuleHiddenHandler | null = null;
export function setModuleHiddenHandler(handler: ModuleHiddenHandler | null): void {
  onModuleHidden = handler;
}

// Separate instance with no interceptors — used only for the refresh call itself,
// so a 401 there never re-triggers the response interceptor below.
const rawClient = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

/** Parent mode: which linked child every request is about. The backend's
 * resolveActiveChild verifies it really is this parent's child before using it.
 * Set by ParentContext; null for students (their token already identifies them). */
let activeStudentId: string | null = null;
export function setActiveStudentId(id: string | null): void {
  activeStudentId = id;
}

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const tokens = await getTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  // Not on the child list itself: a stale saved id (child unlinked since) would make the
  // backend refuse the very request the app needs to recover from it.
  if (activeStudentId && config.url !== '/parent/children') {
    config.headers['X-Active-Student-Id'] = activeStudentId;
  }
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const tokens = await getTokens();
  if (!tokens?.refreshToken) return null;

  try {
    const { data: envelope } = await rawClient.post('/auth/refresh', {
      refreshToken: tokens.refreshToken,
    });
    const accessToken = envelope?.data?.accessToken;
    const refreshToken = envelope?.data?.refreshToken;
    if (!accessToken || !refreshToken) return null;
    await saveTokens({ accessToken, refreshToken });
    return accessToken;
  } catch {
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (error.response?.status === 403 && (error.response.data as { code?: string } | undefined)?.code === 'APP_MODULE_HIDDEN') {
      onModuleHidden?.();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retried) {
      originalRequest._retried = true;

      if (!refreshInFlight) {
        refreshInFlight = refreshAccessToken().finally(() => {
          refreshInFlight = null;
        });
      }
      const newAccessToken = await refreshInFlight;

      if (newAccessToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      }

      await clearTokens();
      onSessionExpired?.();
    }

    return Promise.reject(error);
  },
);
