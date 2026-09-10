// Notification Center Service — /api/v1/super-admin/notifications
import { apiCall } from './api';

const BASE = '/api/v1/super-admin/notifications';

export const notificationService = {
  getAll: () => apiCall(BASE),
  getUnreadCount: () => apiCall(`${BASE}/unread-count`),
  markRead: (id) => apiCall(`${BASE}/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => apiCall(`${BASE}/read-all`, { method: 'PATCH' }),
};

export default notificationService;
