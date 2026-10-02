// Timetable Service — /api/v1/staff/timetable/*
import apiCall from './api';

export const timetableService = {
  getMyTimetable: async () => apiCall('/timetable/my'),
  requestSubstitute: async (body) => apiCall('/timetable/substitutes', { method: 'POST', body }),
  getMySubstituteRequests: async () => apiCall('/timetable/substitutes/mine'),
  getMyCoverClasses: async () => apiCall('/timetable/substitutes/covering'),
  cancelSubstituteRequest: async (id) => apiCall(`/timetable/substitutes/${id}/cancel`, { method: 'POST' }),
  getSubstituteQueue: async () => apiCall('/timetable/substitutes'),
  getAvailableSubstitutes: async (id) => apiCall(`/timetable/substitutes/${id}/available`),
  reviewSubstituteRequest: async (id, body) => apiCall(`/timetable/substitutes/${id}/review`, { method: 'POST', body }),
};

export default timetableService;
