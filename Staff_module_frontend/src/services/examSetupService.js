// Exam Setup Service (Exam Admin) — /api/v1/staff/exam-setup/*
import apiCall from './api';

export const examSetupService = {
  getExams: async () => apiCall('/exam-setup/exams'),
  createExam: async (payload) => apiCall('/exam-setup/exams', { method: 'POST', body: payload }),
  updateExamStatus: async (id, status) => apiCall(`/exam-setup/exams/${id}/status`, { method: 'PATCH', body: { status } }),
  createSchedule: async (payload) => apiCall('/exam-setup/schedules', { method: 'POST', body: payload }),
  deleteSchedule: async (id) => apiCall(`/exam-setup/schedules/${id}`, { method: 'DELETE' }),
};

export default examSetupService;
