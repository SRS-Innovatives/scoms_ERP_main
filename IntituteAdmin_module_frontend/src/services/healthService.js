// Student Health Records Service — /api/v1/admin/health-records/*
import apiCall from './api';

const getAll = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/health-records${query ? `?${query}` : ''}`);
};
const create = (payload) => apiCall('/health-records', { method: 'POST', body: payload });
const update = (id, payload) => apiCall(`/health-records/${id}`, { method: 'PATCH', body: payload });
const remove = (id) => apiCall(`/health-records/${id}`, { method: 'DELETE' });

export const healthService = { getAll, create, update, remove };
export default healthService;
