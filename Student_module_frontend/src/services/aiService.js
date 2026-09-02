// AI Assistant Service — /api/v1/student/ai/ask
import apiCall from './api';

export const aiService = {
  askAiAssistant: async (prompt, subjectContext) => apiCall('/ai/ask', { method: 'POST', body: { prompt, subjectContext } }),
};

export default aiService;
