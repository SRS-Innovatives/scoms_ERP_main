import { apiCall } from './api';

export const subscriptionService = {
  getPlans: async () => {
    return apiCall('/api/v1/super-admin/plans');
  },
  createPlan: async (payload) => {
    return apiCall('/api/v1/super-admin/plans', { method: 'POST', body: payload });
  },
  updatePlan: async (id, payload) => {
    return apiCall(`/api/v1/super-admin/plans/${id}`, { method: 'PATCH', body: payload });
  },
  getSubscriptions: async () => {
    return apiCall('/api/v1/super-admin/subscriptions');
  },
  getRenewals: async () => {
    return apiCall('/api/v1/super-admin/subscriptions/renewals');
  },
  sendRenewalReminder: async (id) => {
    return apiCall(`/api/v1/super-admin/subscriptions/${id}/remind`, { method: 'POST' });
  }
};

export default subscriptionService;
