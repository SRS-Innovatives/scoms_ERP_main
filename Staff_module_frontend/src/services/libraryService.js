// Staff Library Desk — /api/v1/staff/library/*
import apiCall from './api';

export const libraryService = {
  searchStudents: async (q = '') => apiCall(`/library/students?q=${encodeURIComponent(q)}`),
  searchBooks: async (q = '') => apiCall(`/library/books?q=${encodeURIComponent(q)}`),
  issueBook: async (payload) => apiCall('/library/issue', { method: 'POST', body: payload }),
  getActiveIssues: async () => apiCall('/library/issues'),
  returnBook: async (issueId) => apiCall('/library/return', { method: 'POST', body: { issueId } }),
  getFines: async () => apiCall('/library/fines'),
  collectFine: async (id) => apiCall(`/library/fines/${id}/collect`, { method: 'PATCH' }),
};

export default libraryService;
