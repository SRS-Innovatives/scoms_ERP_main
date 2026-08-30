// Subject Service — /api/v1/setup/subjects
import apiCall from './api';

const getAll = (courseId) => apiCall(`/setup/subjects${courseId ? `?courseId=${courseId}` : ''}`);

const create = (payload) => apiCall('/setup/subjects', { method: 'POST', body: payload });

const update = (id, payload) => apiCall(`/setup/subjects/${id}`, { method: 'PATCH', body: payload });

const remove = (id) => apiCall(`/setup/subjects/${id}`, { method: 'DELETE' });

export const subjectService = { getAll, create, update, remove };
export default subjectService;
