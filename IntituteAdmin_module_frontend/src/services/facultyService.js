// Faculty / School Service — /api/v1/admin/setup/faculties (university-level grouping above Department)
import apiCall from './api';

const getAll = () => apiCall('/setup/faculties');

const create = (payload) => apiCall('/setup/faculties', { method: 'POST', body: payload });

const update = (id, payload) => apiCall(`/setup/faculties/${id}`, { method: 'PATCH', body: payload });

const remove = (id) => apiCall(`/setup/faculties/${id}`, { method: 'DELETE' });

export const facultyService = { getAll, create, update, remove };
export default facultyService;
