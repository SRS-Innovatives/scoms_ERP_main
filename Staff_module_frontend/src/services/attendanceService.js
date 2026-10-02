// Attendance Service — /api/v1/staff/attendance/*
import apiCall from './api';

export const attendanceService = {
  getSmsStatus: async () => apiCall('/attendance/sms-status'),
  getMyClasses: async () => apiCall('/attendance/my-classes'),
  getRoster: async (sectionId) => apiCall(`/attendance/roster?sectionId=${sectionId}`),
  getSession: async (sectionId, date, periodNumber = 1) =>
    apiCall(`/attendance/session?sectionId=${sectionId}&date=${date}&periodNumber=${periodNumber}`),
  getHistory: async (sectionId) => apiCall(`/attendance/history${sectionId ? `?sectionId=${sectionId}` : ''}`),
  getMonthlyGrid: async (sectionId, month, year) => apiCall(`/attendance/monthly-grid?sectionId=${sectionId}&month=${month}&year=${year}`),
  markAttendance: async (payload) => apiCall('/attendance/mark', { method: 'POST', body: payload }),
  updateAttendance: async (sessionId, records) => apiCall(`/attendance/${sessionId}`, { method: 'PATCH', body: { records } }),
  requestCorrection: async (sessionId, payload) => apiCall(`/attendance/${sessionId}/corrections`, { method: 'POST', body: payload }),
  getMyCorrections: async () => apiCall('/attendance-corrections/mine'),
  getPendingCorrections: async () => apiCall('/attendance-corrections'),
  reviewCorrection: async (id, decision, remarks) =>
    apiCall(`/attendance-corrections/${id}/review`, { method: 'POST', body: { decision, remarks } }),
};

export default attendanceService;
