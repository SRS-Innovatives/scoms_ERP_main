import { apiCall } from './api';

export const announcementService = {
  getAll: async (institutionId) => {
    const query = institutionId ? `?institutionId=${institutionId}` : '';
    return apiCall(`/api/v1/super-admin/announcements${query}`);
  },
  create: async (data) => {
    return apiCall('/api/v1/super-admin/announcements', { method: 'POST', body: data });
  },
  remove: async (id) => {
    return apiCall(`/api/v1/super-admin/announcements/${id}`, { method: 'DELETE' });
  },
};

export default announcementService;
