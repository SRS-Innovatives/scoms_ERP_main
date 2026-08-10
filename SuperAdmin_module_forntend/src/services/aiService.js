import { apiCall } from './api';

export const aiService = {
  getAiUsage: async () => {
    return apiCall('/api/super-admin/ai-usage', {
      mockResponse: {
        totalTokens: 14500000,
        totalCostUSD: 145.20,
        provider: "OpenAI GPT-4o / Google Gemini 1.5 Pro",
        activeModules: ["Question Generator", "AI Assistant", "Report Generator"]
      }
    });
  }
};

export default aiService;
