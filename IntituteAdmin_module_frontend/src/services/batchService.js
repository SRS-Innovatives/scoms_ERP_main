// Batch Service - /api/v1/setup/batches
import apiCall from './api';

const getAll = (courseId) => apiCall(`/setup/batches${courseId ? `?courseId=${courseId}` : ''}`);

const create = (payload) => apiCall('/setup/batches', { method: 'POST', body: payload });

const update = (id, payload) => apiCall(`/setup/batches/${id}`, { method: 'PATCH', body: payload });

const remove = (id) => apiCall(`/setup/batches/${id}`, { method: 'DELETE' });

export const batchService = { getAll, create, update, remove };
export default batchService;
