// My House Service — /api/v1/student/house
import apiCall from './api';

export const houseService = {
  // { house, standings, recentPoints } — or data: null when the student isn't in a house
  getMyHouse: async () => apiCall('/house'),
};

export default houseService;
