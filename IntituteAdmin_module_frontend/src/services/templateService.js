// Message Template Library Service — /api/v1/admin/templates/*
import apiCall from './api';

const getAll = (channel) => apiCall(`/templates${channel ? `?channel=${channel}` : ''}`);
const create = (payload) => apiCall('/templates', { method: 'POST', body: payload });
const update = (id, payload) => apiCall(`/templates/${id}`, { method: 'PATCH', body: payload });
const remove = (id) => apiCall(`/templates/${id}`, { method: 'DELETE' });

export const templateService = { getAll, create, update, remove };
export default templateService;
