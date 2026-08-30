// Semester Service — /api/v1/setup/semesters
import apiCall from './api';

const getAll = (courseId) => apiCall(`/setup/semesters${courseId ? `?courseId=${courseId}` : ''}`);

const create = (payload) => apiCall('/setup/semesters', { method: 'POST', body: payload });

const update = (id, payload) => apiCall(`/setup/semesters/${id}`, { method: 'PATCH', body: payload });

const remove = (id) => apiCall(`/setup/semesters/${id}`, { method: 'DELETE' });

export const semesterService = { getAll, create, update, remove };
export default semesterService;
