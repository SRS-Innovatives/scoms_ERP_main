// Houses / Groups — /api/v1/admin/setup/houses
import apiCall from './api';

const getAll = () => apiCall('/setup/houses');
const create = (payload) => apiCall('/setup/houses', { method: 'POST', body: payload });
const update = (id, payload) => apiCall(`/setup/houses/${id}`, { method: 'PATCH', body: payload });
const remove = (id) => apiCall(`/setup/houses/${id}`, { method: 'DELETE' });
const getMembers = (id) => apiCall(`/setup/houses/${id}/members`);
const assignMembers = (id, payload) => apiCall(`/setup/houses/${id}/members`, { method: 'POST', body: payload });
const removeMember = (id, studentId) => apiCall(`/setup/houses/${id}/members/${studentId}`, { method: 'DELETE' });
const getPoints = (id) => apiCall(`/setup/houses/${id}/points`);
const awardPoints = (id, payload) => apiCall(`/setup/houses/${id}/points`, { method: 'POST', body: payload });

export const houseService = { getAll, create, update, remove, getMembers, assignMembers, removeMember, getPoints, awardPoints };
export default houseService;
