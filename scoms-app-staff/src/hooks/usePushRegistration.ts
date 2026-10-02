import { useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, getToken, requestPermission, onTokenRefresh } from '@react-native-firebase/messaging';
import { useAuth } from '../store/AuthContext';
import { registerDeviceToken, unregisterDeviceToken } from '../modules/notifications/services/notificationsService';

/**
 * Registers this device for push notifications while the user is signed in, and
 * unregisters on logout — nothing here decides whether a push actually gets sent;
 * the backend independently owns that (see scoms-app-backend's pushNotifications
 * module). Safe to mount once near the app root: it no-ops until authenticated.
 *
 * Uses @react-native-firebase/messaging's modular API (getMessaging/getToken/...),
 * not the deprecated namespaced messaging() default export.
 */
export function usePushRegistration(): void {
  const { isAuthenticated } = useAuth();
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let unsubscribeTokenRefresh: (() => void) | undefined;
    let cancelled = false;

    const register = async (token: string) => {
      if (cancelled) return;
      try {
        await registerDeviceToken(token, Platform.OS === 'ios' ? 'IOS' : 'ANDROID');
        registeredTokenRef.current = token;
      } catch {
        // best-effort — a failed registration just means this device won't get
        // pushes until the next successful attempt (e.g. next app open)
      }
    };

    (async () => {
      try {
        const messaging = getMessaging(getApp());

        if (Platform.OS === 'android' && Platform.Version >= 33) {
          await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        }
        await requestPermission(messaging);

        const token = await getToken(messaging);
        await register(token);

        unsubscribeTokenRefresh = onTokenRefresh(messaging, register);
      } catch {
        // permission denied or FCM unavailable — app still works without push
      }
    })();

    return () => {
      cancelled = true;
      unsubscribeTokenRefresh?.();
      const lastToken = registeredTokenRef.current;
      if (lastToken) {
        unregisterDeviceToken(lastToken).catch(() => {});
        registeredTokenRef.current = null;
      }
    };
  }, [isAuthenticated]);
}
