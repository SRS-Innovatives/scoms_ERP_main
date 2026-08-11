import { mockAssignments } from '../data/mockStudentData';
import { apiCall } from './api';

export const assignmentService = {
  getAssignments: async () => apiCall('/api/student/assignments', { mockResponse: mockAssignments })
};

export default assignmentService;
