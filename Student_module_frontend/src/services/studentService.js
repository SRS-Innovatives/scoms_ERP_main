import { mockStudentSubjects, mockTodaySchedule } from '../data/mockStudentData';
import { apiCall } from './api';

export const studentService = {
  getSubjects: async () => apiCall('/api/student/subjects', { mockResponse: mockStudentSubjects }),
  getSchedule: async () => apiCall('/api/student/schedule', { mockResponse: mockTodaySchedule })
};

export default studentService;
