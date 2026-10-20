// Attendance Oversight Service — /api/v1/admin/attendance/*
import apiCall from './api';

const getRegister = (date, sectionId) => {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (sectionId) params.set('sectionId', sectionId);
  return apiCall(`/attendance/register${params.toString() ? '?' + params.toString() : ''}`);
};

const getAbsentees = (date) => apiCall(`/attendance/absentees${date ? `?date=${date}` : ''}`);

const notifyAbsentees = (studentIds) => apiCall('/attendance/absentees/notify', { method: 'POST', body: { studentIds } });

const getReports = (days = 14) => apiCall(`/attendance/reports?days=${days}`);

const getConsolidatedReport = (sectionId, month, year) =>
  apiCall(`/attendance/consolidated-report?sectionId=${sectionId}&month=${month}&year=${year}`);

const getDateWiseReport = (sectionId, date) =>
  apiCall(`/attendance/date-wise-report?sectionId=${sectionId}&date=${date}`);

const getCorrections = (status) => apiCall(`/attendance/corrections${status ? `?status=${status}` : ''}`);
const reviewCorrection = (id, decision, remarks) =>
  apiCall(`/attendance/corrections/${id}/review`, { method: 'POST', body: { decision, remarks } });

export const attendanceService = {
  getRegister, getAbsentees, notifyAbsentees, getReports, getConsolidatedReport, getDateWiseReport,
  getCorrections, reviewCorrection,
};
export default attendanceService;
