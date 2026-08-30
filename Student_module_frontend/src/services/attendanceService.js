// Attendance Service — /api/v1/student/attendance
import apiCall from './api';

export const attendanceService = {
  getAttendance: async () => apiCall('/attendance'),
};

export default attendanceService;
