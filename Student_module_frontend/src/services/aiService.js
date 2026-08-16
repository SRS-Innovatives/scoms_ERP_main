import { apiCall } from './api';

export const aiService = {
  askAiAssistant: async (prompt) => {
    let responseText = "Newton's laws of motion are three fundamental classical mechanics principles:\n1. First Law (Inertia): An object remains at rest or in uniform motion unless acted upon by a net external force.\n2. Second Law (F = ma): Acceleration is directly proportional to net force and inversely proportional to mass.\n3. Third Law (Action & Reaction): For every action, there is an equal and opposite reaction.";
    if (prompt.toLowerCase().includes('study') || prompt.toLowerCase().includes('plan')) {
      responseText = "Here is your customized 7-day revision schedule for CS8401 Operating Systems and CS8403 DBMS based on your upcoming Mid-Sem Internal Exam on Aug 25th.";
    }
    return apiCall('/api/student/ai-assistant', { mockResponse: { answer: responseText } });
  }
};

export default aiService;
