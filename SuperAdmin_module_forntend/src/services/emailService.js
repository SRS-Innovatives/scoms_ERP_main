import { apiCall } from './api';

export const emailService = {
  getEmailStats: async () => {
    return apiCall('/api/v1/super-admin/email-stats');
  },
  getRecentLogs: async () => {
    return apiCall('/api/v1/super-admin/email/logs');
  },
  getWalletOverview: async () => {
    return apiCall('/api/v1/super-admin/email/wallet');
  },
  purchaseCredits: async (data) => {
    return apiCall('/api/v1/super-admin/email/purchase', { method: 'POST', body: data });
  },
  allocateCredits: async (data) => {
    return apiCall('/api/v1/super-admin/email/allocate', { method: 'POST', body: data });
  },
};

export default emailService;
