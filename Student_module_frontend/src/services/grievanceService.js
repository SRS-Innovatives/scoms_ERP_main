// Grievance Service — /api/v1/student/grievances
import apiCall from './api';

export const grievanceService = {
  getMyGrievances: async () => apiCall('/grievances'),
  submit: async (payload) => apiCall('/grievances', { method: 'POST', body: payload }),
};

export default grievanceService;
