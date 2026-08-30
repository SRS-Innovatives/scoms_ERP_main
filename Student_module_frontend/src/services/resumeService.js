// Resume Service — /api/v1/student/resume
import apiCall from './api';

export const resumeService = {
  getMyResume: async () => apiCall('/resume'),
  updateMyResume: async (payload) => apiCall('/resume', { method: 'PUT', body: payload }),
};

export default resumeService;
