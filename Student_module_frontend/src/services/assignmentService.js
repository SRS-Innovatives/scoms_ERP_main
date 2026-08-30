// Assignment Service — /api/v1/student/assignments/*
import apiCall from './api';

export const assignmentService = {
  getAssignments: async () => apiCall('/assignments'),
  submit: async (payload) => apiCall('/assignments/submit', { method: 'POST', body: payload }),
};

export default assignmentService;
