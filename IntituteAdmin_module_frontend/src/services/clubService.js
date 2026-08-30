// Club Service — /api/v1/admin/clubs
import apiCall from './api';

const getAll = () => apiCall('/clubs');

const create = (payload) => apiCall('/clubs', { method: 'POST', body: payload });

const remove = (id) => apiCall(`/clubs/${id}`, { method: 'DELETE' });

export const clubService = { getAll, create, remove };
export default clubService;
