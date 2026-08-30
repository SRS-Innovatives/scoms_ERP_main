import { apiCall } from './api';

export const whatsappService = {
  getWhatsappStats: async () => {
    return apiCall('/api/v1/super-admin/whatsapp-stats');
  },
  getWalletOverview: async () => {
    return apiCall('/api/v1/super-admin/whatsapp/wallet');
  },
  purchaseCredits: async (data) => {
    return apiCall('/api/v1/super-admin/whatsapp/purchase', { method: 'POST', body: data });
  },
  allocateCredits: async (data) => {
    return apiCall('/api/v1/super-admin/whatsapp/allocate', { method: 'POST', body: data });
  },
};

export default whatsappService;
