import { apiCall } from './api';

export const aiService = {
  getAiUsage: async () => {
    return apiCall('/api/v1/super-admin/ai-usage');
  }
};

export default aiService;
