// Notification Center Service — /api/v1/student/notifications
import apiCall from './api';

export const notificationService = {
  getAll: () => apiCall('/notifications'),
  getUnreadCount: () => apiCall('/notifications/unread-count'),
  markRead: (id) => apiCall(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => apiCall('/notifications/read-all', { method: 'PATCH' }),
};

export default notificationService;
