import { mockSmsGateways } from '../data/mockSmsData';
import { apiCall } from './api';

export const smsService = {
  getSmsStats: async () => {
    return apiCall('/api/super-admin/sms-stats', { mockResponse: mockSmsGateways });
  }
};

export default smsService;
