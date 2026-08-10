import { mockAnalytics } from '../data/mockAnalyticsData';
import { apiCall } from './api';

export const analyticsService = {
  getAnalytics: async () => {
    return apiCall('/api/super-admin/analytics', { mockResponse: mockAnalytics });
  }
};

export default analyticsService;
