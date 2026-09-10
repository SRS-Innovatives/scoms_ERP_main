// Student Profile Service — /api/v1/student/profile
import apiCall from './api';

export const studentService = {
  getProfile: async () => apiCall('/profile'),
  updateProfile: async (payload) => apiCall('/profile', { method: 'PATCH', body: payload }),
  getMySubjects: async () => apiCall('/subjects'),
  getIdCard: async () => apiCall('/profile/id-card'),
};

export default studentService;
