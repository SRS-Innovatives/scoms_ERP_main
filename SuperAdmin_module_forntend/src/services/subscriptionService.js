import { apiCall } from './api';

export const subscriptionService = {
  getPlans: async () => {
    return apiCall('/api/v1/super-admin/plans');
  },
  getSubscriptions: async () => {
    return apiCall('/api/v1/super-admin/subscriptions');
  }
};

export default subscriptionService;
