// Official Circulars — /api/v1/admin/circulars
import apiCall from './api';

const getAll = () => apiCall('/circulars');
const getById = (id) => apiCall(`/circulars/${id}`);
const create = (payload) => apiCall('/circulars', { method: 'POST', body: payload });
const update = (id, payload) => apiCall(`/circulars/${id}`, { method: 'PATCH', body: payload });
const remove = (id) => apiCall(`/circulars/${id}`, { method: 'DELETE' });

export const circularService = { getAll, getById, create, update, remove };
export default circularService;
