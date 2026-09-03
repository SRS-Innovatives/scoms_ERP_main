import { apiCall } from './api';

const BASE = '/api/v1/super-admin';

export const reportManagementService = {
  getReports: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`${BASE}/reports${query ? `?${query}` : ''}`);
  },
  getReportById: (id) => apiCall(`${BASE}/reports/${id}`),
  createReport: (payload) => apiCall(`${BASE}/reports`, { method: 'POST', body: payload }),
  updateReport: (id, payload) => apiCall(`${BASE}/reports/${id}`, { method: 'PATCH', body: payload }),
  archiveReport: (id) => apiCall(`${BASE}/reports/${id}`, { method: 'DELETE' }),
  cloneReport: (id, payload) => apiCall(`${BASE}/reports/${id}/clone`, { method: 'POST', body: payload }),

  getInstitutionReports: (institutionId) => apiCall(`${BASE}/institutions/${institutionId}/reports`),
  assignReportsToInstitution: (institutionId, assignments) =>
    apiCall(`${BASE}/institutions/${institutionId}/reports`, { method: 'POST', body: { assignments } }),
  updateInstitutionReport: (institutionId, reportId, payload) =>
    apiCall(`${BASE}/institutions/${institutionId}/reports/${reportId}`, { method: 'PATCH', body: payload }),

  getReportRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`${BASE}/report-requests${query ? `?${query}` : ''}`);
  },
  updateReportRequest: (id, payload) => apiCall(`${BASE}/report-requests/${id}`, { method: 'PATCH', body: payload }),
};

export default reportManagementService;
