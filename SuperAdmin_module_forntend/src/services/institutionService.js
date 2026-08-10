import { mockInstitutions } from '../data/mockInstitutionsData';
import { apiCall } from './api';

export const institutionService = {
  getInstitutions: async () => {
    return apiCall('/api/super-admin/institutions', { mockResponse: mockInstitutions });
  },

  getInstitutionById: async (id) => {
    const found = mockInstitutions.find(i => i.id === id) || mockInstitutions[0];
    return apiCall(`/api/super-admin/institutions/${id}`, { mockResponse: found });
  },

  createInstitution: async (data) => {
    const newInst = { id: `INST-00${mockInstitutions.length + 1}`, ...data, createdDate: new Date().toISOString().split('T')[0] };
    return apiCall('/api/super-admin/institutions', { mockResponse: newInst });
  },

  updateInstitutionStatus: async (id, status) => {
    return apiCall(`/api/super-admin/institutions/${id}/status`, { mockResponse: { id, status, success: true } });
  }
};

export default institutionService;
