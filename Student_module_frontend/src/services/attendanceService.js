// Attendance Service — /api/v1/student/attendance
import apiCall from './api';

export const attendanceService = {
  getAttendance: async () => apiCall('/attendance'),
  // ask for a wrong mark to be fixed (decided by Principal / HOD / Institute Admin)
  getMyCorrections: async () => apiCall('/attendance/corrections'),
  requestCorrection: async (payload) => apiCall('/attendance/corrections', { method: 'POST', body: payload }),
};

export default attendanceService;
