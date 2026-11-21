// Study Material Service — /api/v1/staff/materials/*
import apiCall from './api';

export const materialService = {
  getMySubjects: async () => apiCall('/materials/my-subjects'),
  getMaterials: async () => apiCall('/materials'),
  createMaterial: async (payload) => apiCall('/materials', { method: 'POST', body: payload }),
  deleteMaterial: async (id) => apiCall(`/materials/${id}`, { method: 'DELETE' }),
  // Download History: my materials with open counts; one material's opened / not-opened students
  getDownloadHistory: async () => apiCall('/materials/download-history'),
  getMaterialDownloads: async (id) => apiCall(`/materials/${id}/downloads`),
};

export default materialService;
