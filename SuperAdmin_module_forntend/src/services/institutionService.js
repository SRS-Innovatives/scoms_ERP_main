import { apiCall } from './api';

export const institutionService = {
  getInstitutions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/api/v1/super-admin/institutions${query ? '?' + query : ''}`);
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

  getModuleCatalog: async () => {
    return apiCall('/api/v1/super-admin/institutions/modules-catalog');
  },

  updateInstitutionModules: async (id, modules) => {
    return apiCall(`/api/v1/super-admin/institutions/${id}/modules`, { method: 'PATCH', body: { modules } });
  },

  deleteInstitution: async (id) => {
    return apiCall(`/api/v1/super-admin/institutions/${id}`, { method: 'DELETE' });
  }
};

export default institutionService;
