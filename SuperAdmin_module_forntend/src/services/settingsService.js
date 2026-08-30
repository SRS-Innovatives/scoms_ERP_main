import { apiCall } from './api';

export const settingsService = {
  getSettings: async () => {
    return apiCall('/api/v1/super-admin/settings');
  },
  updateSettings: async (payload) => {
    return apiCall('/api/v1/super-admin/settings', { method: 'PUT', body: payload });
  }
};

export default settingsService;
