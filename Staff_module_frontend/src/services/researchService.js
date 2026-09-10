// Research & Publications Service — /api/v1/staff/research/*
import apiCall from './api';

export const researchService = {
  getAll: () => apiCall('/research'),
  create: (payload) => apiCall('/research', { method: 'POST', body: payload }),
  update: (id, payload) => apiCall(`/research/${id}`, { method: 'PATCH', body: payload }),
  remove: (id) => apiCall(`/research/${id}`, { method: 'DELETE' }),
};

export default researchService;
