// Parent-Teacher Meeting Notes Service — /api/v1/staff/parent-meetings
import apiCall from './api';

export const parentMeetingService = {
  getMyNotes: async () => apiCall('/parent-meetings'),
  createNote: async (payload) => apiCall('/parent-meetings', { method: 'POST', body: payload }),
};

export default parentMeetingService;
