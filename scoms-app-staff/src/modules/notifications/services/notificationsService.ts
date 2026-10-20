import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export async function fetchNotifications(limit = 30): Promise<NotificationItem[]> {
  const { data } = await apiClient.get<ApiEnvelope<NotificationItem[]>>('/notifications', {
    params: { limit },
  });
  return data.data;
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<ApiEnvelope<{ count: number }>>('/notifications/unread-count');
  return data.data.count;
}

export async function markNotificationRead(id: string) {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await apiClient.patch('/notifications/read-all');
}

export type DevicePlatform = 'ANDROID' | 'IOS';

export async function registerDeviceToken(token: string, platform: DevicePlatform) {
  await apiClient.post('/notifications/device-token', { token, platform });
}

export async function unregisterDeviceToken(token: string) {
  await apiClient.delete('/notifications/device-token', { data: { token } });
}
