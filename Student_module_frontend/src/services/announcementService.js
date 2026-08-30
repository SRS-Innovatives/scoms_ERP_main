// Announcement Service — /api/v1/student/announcements
import apiCall from './api';

export const announcementService = {
  getAll: async () => apiCall('/announcements'),
};

export default announcementService;
