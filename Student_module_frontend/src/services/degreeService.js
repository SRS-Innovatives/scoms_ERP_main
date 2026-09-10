// My Degree Service — /api/v1/student/degrees
import apiCall from './api';

export const degreeService = {
  getAll: () => apiCall('/degrees'),
};

export default degreeService;
