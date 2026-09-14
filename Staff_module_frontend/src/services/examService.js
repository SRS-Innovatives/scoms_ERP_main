// Examination Service — /api/v1/staff/exams/*, /exam-schedules/*
import apiCall from './api';

export const examService = {
  getMySchedules: async () => apiCall('/exams/my-schedules'),
  getRoster: async (scheduleId) => apiCall(`/exam-schedules/${scheduleId}/roster`),
  saveMarks: async (scheduleId, marks) => apiCall(`/exam-schedules/${scheduleId}/marks`, { method: 'POST', body: { marks } }),
  publishMarks: async (scheduleId) => apiCall(`/exam-schedules/${scheduleId}/publish`, { method: 'POST' }),
  importMarksCsv: async (scheduleId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiCall(`/exam-schedules/${scheduleId}/import`, { method: 'POST', body: formData });
  },
  getSubjectPerformance: async () => apiCall('/exams/subject-performance'),
  getStudentPerformance: async () => apiCall('/exams/student-performance'),
  getMySubjects: async () => apiCall('/questions/my-subjects'),
  getQuestions: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiCall(`/questions${params ? `?${params}` : ''}`);
  },
  createQuestion: async (payload) => apiCall('/questions', { method: 'POST', body: payload }),
  generateQuestionPaper: async (payload) => apiCall('/questions/generate-paper', { method: 'POST', body: payload }),
};

export default examService;
