// Leave Service — /api/v1/student/leave
import apiCall from './api';

export const leaveService = {
  getMyLeaves: async () => apiCall('/leave'),
  getLeaveTypes: async () => apiCall('/leave/types'),
  apply: async (payload) => apiCall('/leave', { method: 'POST', body: payload }),
};

export default leaveService;
