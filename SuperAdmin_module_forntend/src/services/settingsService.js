import { apiCall } from './api';

export const settingsService = {
  getSettings: async () => {
    return apiCall('/api/v1/super-admin/settings');
  }
};

export default settingsService;
