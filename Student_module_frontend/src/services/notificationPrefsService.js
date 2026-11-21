// SMS / WhatsApp preferences — /api/v1/student/settings/notifications
import apiCall from './api';

export const notificationPrefsService = {
  get: async () => apiCall('/settings/notifications'),
  save: async (prefs) => apiCall('/settings/notifications', { method: 'PUT', body: { prefs } }),
};

export default notificationPrefsService;
