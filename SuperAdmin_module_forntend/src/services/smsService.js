import { apiCall } from './api';

export const smsService = {
  getSmsStats: async () => {
    return apiCall('/api/v1/super-admin/sms-stats');
  }
};

export default smsService;
