// Event Service — /api/v1/staff/events/*
import apiCall from './api';

export const eventService = {
  getEvents: async () => apiCall('/events'),
  getRegistrations: async (eventId) => apiCall(`/events/${eventId}/registrations`),
  markAttendance: async (eventId, records) => apiCall(`/events/${eventId}/attendance`, { method: 'POST', body: { records } }),
};

export default eventService;
