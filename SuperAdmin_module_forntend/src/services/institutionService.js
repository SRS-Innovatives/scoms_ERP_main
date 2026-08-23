import { apiCall } from './api';

export const institutionService = {
  getInstitutions: async () => {
    return apiCall('/api/v1/super-admin/institutions');
  },

  getInstitutionById: async (id) => {
    return apiCall(`/api/v1/super-admin/institutions/${id}`);
  },

  createInstitution: async (data) => {
    return apiCall('/api/v1/super-admin/institutions', { method: 'POST', body: data });
  },

  updateInstitutionStatus: async (id, status) => {
    return apiCall(`/api/v1/super-admin/institutions/${id}/status`, { method: 'PATCH', body: { status } });
  },

  updateInstitution: async (id, data) => {
    return apiCall(`/api/v1/super-admin/institutions/${id}`, { method: 'PUT', body: data });
  },

  deleteInstitution: async (id) => {
    return apiCall(`/api/v1/super-admin/institutions/${id}`, { method: 'DELETE' });
  }
};

export default institutionService;
