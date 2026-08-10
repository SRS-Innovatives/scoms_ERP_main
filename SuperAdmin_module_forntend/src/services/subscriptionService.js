import { mockPlans, mockSubscriptions } from '../data/mockSubscriptionsData';
import { apiCall } from './api';

export const subscriptionService = {
  getPlans: async () => {
    return apiCall('/api/super-admin/plans', { mockResponse: mockPlans });
  },
  getSubscriptions: async () => {
    return apiCall('/api/super-admin/subscriptions', { mockResponse: mockSubscriptions });
  }
};

export default subscriptionService;
