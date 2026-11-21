// Notification Center Service — /api/v1/student/notifications
import apiCall from './api';

export const notificationService = {
  // limit: how many of the newest to fetch (server default 30, max 100)
  getAll: (limit) => apiCall(`/notifications${limit ? `?limit=${limit}` : ''}`),
  getUnreadCount: () => apiCall('/notifications/unread-count'),
  markRead: (id) => apiCall(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => apiCall('/notifications/read-all', { method: 'PATCH' }),
};

export default notificationService;
