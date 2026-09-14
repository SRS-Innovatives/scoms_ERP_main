import { apiCall } from './api';

export const admissionFieldService = {
  getPending: async () => apiCall('/api/v1/super-admin/admission-fields/pending'),
  getForInstitution: async (institutionId) => apiCall(`/api/v1/super-admin/admission-fields/institution/${institutionId}`),
  approve: async (id) => apiCall(`/api/v1/super-admin/admission-fields/${id}/approve`, { method: 'POST' }),
  reject: async (id, reason) => apiCall(`/api/v1/super-admin/admission-fields/${id}/reject`, { method: 'POST', body: { reason } }),
  bulkReview: async (fieldIds, decision, reason) => apiCall('/api/v1/super-admin/admission-fields/bulk-review', { method: 'POST', body: { fieldIds, decision, reason } }),
};

export default admissionFieldService;
