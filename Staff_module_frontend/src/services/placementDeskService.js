// Placement Cell Service (Placement Officer) — /api/v1/staff/postings/*
import apiCall from './api';

export const placementDeskService = {
  getPostings: async () => apiCall('/postings'),
  createPosting: async (payload) => apiCall('/postings', { method: 'POST', body: payload }),
  closePosting: async (id) => apiCall(`/postings/${id}/close`, { method: 'PATCH' }),
  getApplications: async (id) => apiCall(`/postings/${id}/applications`),
  updateApplicationStatus: async (id, status) => apiCall(`/postings/applications/${id}`, { method: 'PATCH', body: { status } }),
};

export default placementDeskService;
