// Placement Cell Service — /api/v1/admin/postings/*
import apiCall from './api';

const getAll = () => apiCall('/postings');
const create = (payload) => apiCall('/postings', { method: 'POST', body: payload });
const close = (id) => apiCall(`/postings/${id}/close`, { method: 'PATCH' });
const getApplications = (id) => apiCall(`/postings/${id}/applications`);
const updateApplicationStatus = (applicationId, status) => apiCall(`/postings/applications/${applicationId}`, { method: 'PATCH', body: { status } });

export const jobPostingService = { getAll, create, close, getApplications, updateApplicationStatus };
export default jobPostingService;
