// Examination Service — /api/v1/student/exams/*
import apiCall from './api';

export const examService = {
  getExamSchedule: async () => apiCall('/exams/schedule'),
  getResults: async () => apiCall('/exams/results'),
};

export default examService;
