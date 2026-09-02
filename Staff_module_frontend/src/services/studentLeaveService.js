// Student Leave Approval Service — /api/v1/staff/student-leave
import apiCall from './api';

export const studentLeaveService = {
  getStudentLeaves: async () => apiCall('/student-leave'),
  updateStatus: async (id, status) => apiCall(`/student-leave/${id}`, { method: 'PATCH', body: { status } }),
};

export default studentLeaveService;
