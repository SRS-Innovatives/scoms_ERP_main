import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../../constants/config';
import { clearTokens, getTokens, saveTokens } from '../../utils/secureStorage';

/** Fired on unrecoverable auth failure (refresh failed) so the auth store can force logout. */
type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;
export function setSessionExpiredHandler(handler: SessionExpiredHandler): void {
  onSessionExpired = handler;
}

// Separate instance with no interceptors — used only for the refresh call itself,
// so a 401 there never re-triggers the response interceptor below.
const rawClient = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const tokens = await getTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
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
