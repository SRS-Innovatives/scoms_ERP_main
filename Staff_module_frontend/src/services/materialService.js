// Study Material Service — /api/v1/staff/materials/*
import apiCall from './api';

export const materialService = {
  getMySubjects: async () => apiCall('/materials/my-subjects'),
  getMaterials: async () => apiCall('/materials'),
  createMaterial: async (payload) => apiCall('/materials', { method: 'POST', body: payload }),
  deleteMaterial: async (id) => apiCall(`/materials/${id}`, { method: 'DELETE' }),
};

export default materialService;
