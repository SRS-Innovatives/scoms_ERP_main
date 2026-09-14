// Convocation & Degree Issuance Service — /api/v1/admin/degrees/*
import apiCall from './api';

const getAll = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/degrees${query ? `?${query}` : ''}`);
};
const create = (payload) => apiCall('/degrees', { method: 'POST', body: payload });
const issue = (id, payload) => apiCall(`/degrees/${id}/issue`, { method: 'PATCH', body: payload });
const revoke = (id) => apiCall(`/degrees/${id}/revoke`, { method: 'PATCH' });
const remove = (id) => apiCall(`/degrees/${id}`, { method: 'DELETE' });

export const degreeService = { getAll, create, issue, revoke, remove };
export default degreeService;
