// Official Circulars (read-only) — /api/v1/staff/circulars
import apiCall from './api';

export const circularService = {
  getAll: async () => apiCall('/circulars'),
  getById: async (id) => apiCall(`/circulars/${id}`),
};

export default circularService;
