// Announcement Service — /api/v1/staff/announcements
import apiCall from './api';

export const announcementService = {
  getAll: async () => apiCall('/announcements'),
  create: async (payload) => apiCall('/announcements', { method: 'POST', body: payload }),
};

export default announcementService;
