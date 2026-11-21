import { apiCall } from './api';

// Notification Center — platform-wide broadcasts (in-app bell + push, optional email / SMS)
export const broadcastService = {
  getHistory: async (page = 1) => apiCall(`/api/v1/super-admin/broadcasts?page=${page}`),
  preview: async (payload) => apiCall('/api/v1/super-admin/broadcasts/preview', { method: 'POST', body: payload }),
  send: async (payload) => apiCall('/api/v1/super-admin/broadcasts', { method: 'POST', body: payload }),
};

export default broadcastService;
