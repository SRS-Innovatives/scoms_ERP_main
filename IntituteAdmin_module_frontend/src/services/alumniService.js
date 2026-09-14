// Alumni Network Service — /api/v1/admin/alumni/*
import apiCall from './api';

const getAll = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/alumni${query ? `?${query}` : ''}`);
};
const getEligibleStudents = () => apiCall('/alumni/eligible-students');
const create = (payload) => apiCall('/alumni', { method: 'POST', body: payload });
const update = (id, payload) => apiCall(`/alumni/${id}`, { method: 'PATCH', body: payload });
const remove = (id) => apiCall(`/alumni/${id}`, { method: 'DELETE' });

export const alumniService = { getAll, getEligibleStudents, create, update, remove };
export default alumniService;
