// Department Service — /api/v1/setup/departments
import apiCall from './api';

const getAll = () => apiCall('/setup/departments');

const create = (payload) => apiCall('/setup/departments', { method: 'POST', body: payload });

const update = (id, payload) => apiCall(`/setup/departments/${id}`, { method: 'PATCH', body: payload });

const remove = (id) => apiCall(`/setup/departments/${id}`, { method: 'DELETE' });

export const departmentService = { getAll, create, update, remove };
export default departmentService;
