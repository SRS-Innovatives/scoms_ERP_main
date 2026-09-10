// Student Discipline Service — /api/v1/admin/discipline/*
import apiCall from './api';

const getAll = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/discipline${query ? `?${query}` : ''}`);
};
const create = (payload) => apiCall('/discipline', { method: 'POST', body: payload });
const update = (id, payload) => apiCall(`/discipline/${id}`, { method: 'PATCH', body: payload });
const remove = (id) => apiCall(`/discipline/${id}`, { method: 'DELETE' });

export const disciplineService = { getAll, create, update, remove };
export default disciplineService;
