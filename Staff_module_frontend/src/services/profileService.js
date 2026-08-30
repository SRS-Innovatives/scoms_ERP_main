// Staff Self-Service Profile — /api/v1/staff/profile/*, /leave, /attendance/self
import apiCall from './api';

export const profileService = {
  getMyProfile: async () => apiCall('/profile/me'),
  updateMyProfile: async (payload) => apiCall('/profile/me', { method: 'PATCH', body: payload }),
  addQualification: async (payload) => apiCall('/profile/qualifications', { method: 'POST', body: payload }),
  addExperience: async (payload) => apiCall('/profile/experience', { method: 'POST', body: payload }),

  getMyLeaves: async () => apiCall('/leave'),
  applyLeave: async (payload) => apiCall('/leave', { method: 'POST', body: payload }),

  getMyAttendance: async (month, year) => apiCall(`/attendance/self?month=${month}&year=${year}`),

  changePassword: async (payload) => apiCall('/auth/change-password', { method: 'POST', body: payload }),
};

export default profileService;
