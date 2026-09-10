// Textbook Content Service — /api/v1/admin/textbooks/*
import apiCall from './api';

const getAll = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/textbooks${query ? `?${query}` : ''}`);
};
const create = (payload) => apiCall('/textbooks', { method: 'POST', body: payload });
const update = (id, payload) => apiCall(`/textbooks/${id}`, { method: 'PATCH', body: payload });
const remove = (id) => apiCall(`/textbooks/${id}`, { method: 'DELETE' });

export const textbookService = { getAll, create, update, remove };
export default textbookService;
