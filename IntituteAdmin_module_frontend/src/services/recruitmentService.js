// HR Recruitment Service — /api/v1/admin/recruitment
import apiCall from './api';

const getOpenings = (status) => apiCall(`/recruitment/openings${status ? `?status=${status}` : ''}`);
const createOpening = (payload) => apiCall('/recruitment/openings', { method: 'POST', body: payload });
const closeOpening = (id) => apiCall(`/recruitment/openings/${id}/close`, { method: 'PATCH' });
const getApplications = (openingId) => apiCall(`/recruitment/openings/${openingId}/applications`);
const addApplication = (openingId, payload) => apiCall(`/recruitment/openings/${openingId}/applications`, { method: 'POST', body: payload });
const updateApplicationStatus = (applicationId, payload) => apiCall(`/recruitment/applications/${applicationId}`, { method: 'PATCH', body: payload });

export const recruitmentService = { getOpenings, createOpening, closeOpening, getApplications, addApplication, updateApplicationStatus };
export default recruitmentService;
