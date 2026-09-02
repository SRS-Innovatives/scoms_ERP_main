// Achievements Service — /api/v1/student/achievements
import apiCall from './api';

export const achievementService = {
  getMyAchievements: async () => apiCall('/achievements'),
  addAchievement: async (payload) => apiCall('/achievements', { method: 'POST', body: payload }),
};

export default achievementService;
