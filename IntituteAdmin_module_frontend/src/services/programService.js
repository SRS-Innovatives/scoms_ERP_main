// Program Service - /api/v1/setup/programs
import apiCall from './api';

const getAll = (departmentId) => apiCall(`/setup/programs${departmentId ? `?departmentId=${departmentId}` : ''}`);

const create = (payload) => apiCall('/setup/programs', { method: 'POST', body: payload });

const update = (id, payload) => apiCall(`/setup/programs/${id}`, { method: 'PATCH', body: payload });

const remove = (id) => apiCall(`/setup/programs/${id}`, { method: 'DELETE' });

export const programService = { getAll, create, update, remove };
export default programService;
