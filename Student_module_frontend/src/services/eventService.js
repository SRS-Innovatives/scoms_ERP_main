// Event Service — /api/v1/student/events/*
import apiCall from './api';

export const eventService = {
  getEvents: async () => apiCall('/events'),
  register: async (eventId) => apiCall('/events/register', { method: 'POST', body: { eventId } }),
};

export default eventService;
