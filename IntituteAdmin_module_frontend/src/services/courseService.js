// Course Service — /api/v1/setup/courses
import apiCall from './api';

const getAll = (departmentId) => apiCall(`/setup/courses${departmentId ? `?departmentId=${departmentId}` : ''}`);

const create = (payload) => apiCall('/setup/courses', { method: 'POST', body: payload });

const update = (id, payload) => apiCall(`/setup/courses/${id}`, { method: 'PATCH', body: payload });

const remove = (id) => apiCall(`/setup/courses/${id}`, { method: 'DELETE' });

export const courseService = { getAll, create, update, remove };
export default courseService;
