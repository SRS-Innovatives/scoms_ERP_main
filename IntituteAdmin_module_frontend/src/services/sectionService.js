// Section Service — /api/v1/setup/sections
import apiCall from './api';

const getAll = (semesterId) => apiCall(`/setup/sections${semesterId ? `?semesterId=${semesterId}` : ''}`);

const create = (payload) => apiCall('/setup/sections', { method: 'POST', body: payload });

const update = (id, payload) => apiCall(`/setup/sections/${id}`, { method: 'PATCH', body: payload });

const remove = (id) => apiCall(`/setup/sections/${id}`, { method: 'DELETE' });

export const sectionService = { getAll, create, update, remove };
export default sectionService;
