// Announcement Service — /api/v1/admin/announcements
import apiCall from './api';

const getAll = () => apiCall('/announcements');

const create = (payload) => apiCall('/announcements', { method: 'POST', body: payload });

const remove = (id) => apiCall(`/announcements/${id}`, { method: 'DELETE' });

export const announcementService = { getAll, create, remove };
export default announcementService;
