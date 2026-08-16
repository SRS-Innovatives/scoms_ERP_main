import { mockStudentSubjects } from '../data/mockStudentData';
import { apiCall } from './api';

export const attendanceService = {
  getAttendance: async () => apiCall('/api/student/attendance', { mockResponse: { overall: 88.5, subjects: mockStudentSubjects } })
};

export default attendanceService;
