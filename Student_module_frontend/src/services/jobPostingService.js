// Internships & Placements Service — /api/v1/student/postings/*
import apiCall from './api';

export const jobPostingService = {
  getPostings: async (type) => apiCall(`/postings${type ? `?type=${type}` : ''}`),
  apply: async (jobPostingId) => apiCall('/postings/apply', { method: 'POST', body: { jobPostingId } }),
  getMyApplications: async () => apiCall('/postings/my-applications'),
};

export default jobPostingService;
