// Club Service — /api/v1/student/clubs/*
import apiCall from './api';

export const clubService = {
  getClubs: async () => apiCall('/clubs'),
  join: async (clubId) => apiCall('/clubs/join', { method: 'POST', body: { clubId } }),
};

export default clubService;
