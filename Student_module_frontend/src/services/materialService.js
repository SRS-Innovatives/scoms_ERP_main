// Study Material Service — /api/v1/student/materials
import apiCall from './api';

export const materialService = {
  getMaterials: async () => apiCall('/materials'),
};

export default materialService;
