// Club Service — /api/v1/staff/clubs
import apiCall from './api';

export const clubService = {
  getClubs: async () => apiCall('/clubs'),
};

export default clubService;
