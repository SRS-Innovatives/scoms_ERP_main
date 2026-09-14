import { apiCall } from './api';

export const aiService = {
  getAiUsage: async () => {
    return apiCall('/api/v1/super-admin/ai-usage');
  },
  getAiConfig: async () => {
    return apiCall('/api/v1/super-admin/ai-config');
  },
  updateAiConfig: async (payload) => {
    return apiCall('/api/v1/super-admin/ai-config', { method: 'PATCH', body: payload });
  }
};

export default aiService;
