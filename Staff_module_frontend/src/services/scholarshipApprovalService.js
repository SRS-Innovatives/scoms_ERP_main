// Scholarship Approvals (class teacher) — /api/v1/staff/scholarship-approvals
import apiCall from './api';

export const scholarshipApprovalService = {
  getAll: async (status) => apiCall(`/scholarship-approvals${status ? `?status=${status}` : ''}`),
  review: async (id, decision, remarks) => apiCall(`/scholarship-approvals/${id}/review`, { method: 'POST', body: { decision, remarks } }),
};

export default scholarshipApprovalService;
