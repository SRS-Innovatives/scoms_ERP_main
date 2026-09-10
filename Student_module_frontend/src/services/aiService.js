// AI Study Tutor Service — /api/v1/student/ai/*
import apiCall from './api';

export const aiService = {
  getTopics: async () => apiCall('/ai/topics'),
  askAiAssistant: async ({ prompt, classGrade, subject, language }) =>
    apiCall('/ai/ask', { method: 'POST', body: { prompt, classGrade, subject, language } }),
};

export default aiService;
