// Assignment Service — /api/v1/staff/assignments/*
import apiCall from './api';

export const assignmentService = {
  getMyClasses: async () => apiCall('/assignments/my-classes'),
  getAssignments: async () => apiCall('/assignments'),
  createAssignment: async (payload) => apiCall('/assignments', { method: 'POST', body: payload }),
  getAssignmentById: async (id) => apiCall(`/assignments/${id}`),
  getSubmissions: async (id) => apiCall(`/assignments/${id}/submissions`),
  evaluateSubmission: async (submissionId, payload) => apiCall(`/assignments/submissions/${submissionId}/evaluate`, { method: 'PATCH', body: payload }),
};

export default assignmentService;
