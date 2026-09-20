// Academic Calendar Service — /api/v1/admin/academic-calendar
import apiCall from './api';

const getEvents = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/academic-calendar${query ? `?${query}` : ''}`);
};
const createEvent = (payload) => apiCall('/academic-calendar', { method: 'POST', body: payload });
const updateEvent = (id, payload) => apiCall(`/academic-calendar/${id}`, { method: 'PATCH', body: payload });
const deleteEvent = (id) => apiCall(`/academic-calendar/${id}`, { method: 'DELETE' });

export const academicCalendarService = { getEvents, createEvent, updateEvent, deleteEvent };
export default academicCalendarService;
