// Study Material Service — /api/v1/student/materials
import apiCall from './api';

export const materialService = {
  getMaterials: async () => apiCall('/materials'),
  // tells the teacher's Download History this material was opened — never blocks opening it
  markOpened: (id) => apiCall(`/materials/${id}/opened`, { method: 'POST' }).catch(() => {}),
};

export default materialService;
