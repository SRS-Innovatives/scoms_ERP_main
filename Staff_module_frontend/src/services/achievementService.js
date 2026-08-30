// Student Achievement / Event Certificate Entry Service — /api/v1/staff/achievements
import apiCall from './api';

export const achievementService = {
  getAll: async () => apiCall('/achievements'),
  create: async (payload) => apiCall('/achievements', { method: 'POST', body: payload }),
};

export default achievementService;
