// Examination Service — /api/v1/student/exams/*
import apiCall from './api';

export const examService = {
  getExamSchedule: async () => apiCall('/exams/schedule'),
  getResults: async () => apiCall('/exams/results'),
  // the student's own hall ticket for one exam (while it's scheduled / ongoing)
  getHallTicket: async (examId) => apiCall(`/exams/${examId}/hall-ticket`),
  // the student's own marksheet for one exam — published subjects only, with SGPA / CGPA
  getMarksheet: async (examId) => apiCall(`/exams/${examId}/marksheet`),
};

export default examService;
