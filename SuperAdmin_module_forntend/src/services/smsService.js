import { apiCall } from './api';

export const smsService = {
  getSmsStats: async () => {
    return apiCall('/api/v1/super-admin/sms-stats');
  },
  getWalletOverview: async () => {
    return apiCall('/api/v1/super-admin/sms/wallet');
  },
  purchaseCredits: async (data) => {
    return apiCall('/api/v1/super-admin/sms/purchase', { method: 'POST', body: data });
  },
  allocateCredits: async (data) => {
    return apiCall('/api/v1/super-admin/sms/allocate', { method: 'POST', body: data });
  },
};

export default smsService;
