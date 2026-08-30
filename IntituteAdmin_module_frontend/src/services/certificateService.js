// Certificate Service — /api/v1/admin/certificates/*
import apiCall from './api';

const getAll = (type) => apiCall(`/certificates${type ? `?type=${type}` : ''}`);
const generate = (payload) => apiCall('/certificates/generate', { method: 'POST', body: payload });
const getRequests = () => apiCall('/certificate-requests');
const resolveRequest = (id, decision) => apiCall(`/certificate-requests/${id}`, { method: 'PATCH', body: { decision } });

export const certificateService = { getAll, generate, getRequests, resolveRequest };
export default certificateService;
