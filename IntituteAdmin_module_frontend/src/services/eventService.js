// Event Service — /api/v1/admin/events
import apiCall from './api';

const getAll = () => apiCall('/events');

const create = (payload) => apiCall('/events', { method: 'POST', body: payload });

const remove = (id) => apiCall(`/events/${id}`, { method: 'DELETE' });

export const eventService = { getAll, create, remove };
export default eventService;
