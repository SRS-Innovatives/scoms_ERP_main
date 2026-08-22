import { apiCall } from './api';

export const analyticsService = {
  getAnalytics: async () => {
    return apiCall('/api/v1/super-admin/analytics');
  }
};

export default analyticsService;
