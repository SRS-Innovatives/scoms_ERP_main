// Dynamic Report Engine Service — /api/v1/admin/reports/*
import apiCall from './api';

export const reportService = {
  getCatalog: () => apiCall('/reports/catalog'),
  getDefinition: (code) => apiCall(`/reports/${code}/definition`),
  getFilterOptions: (source, context = {}) => {
    const params = new URLSearchParams({ source, ...context }).toString();
    return apiCall(`/reports/filter-options?${params}`);
  },
  preview: (code, filters) => apiCall(`/reports/${code}/preview`, { method: 'POST', body: { filters, format: 'PREVIEW' } }),
  generate: (code, filters) => apiCall(`/reports/${code}/generate`, { method: 'POST', body: { filters, format: 'PREVIEW' } }),
  exportReport: async (code, filters, format) => {
    const res = await apiCall(`/reports/${code}/export`, { method: 'POST', body: { filters, format }, responseType: 'blob' });
    return res.blob;
  },
  getHistory: () => apiCall('/reports/history'),
  getSaved: () => apiCall('/reports/saved'),
  createSaved: (reportCode, name, filters) => apiCall('/reports/saved', { method: 'POST', body: { reportCode, name, filters } }),
  deleteSaved: (id) => apiCall(`/reports/saved/${id}`, { method: 'DELETE' }),
  createRequest: (payload) => apiCall('/report-requests', { method: 'POST', body: payload }),
  getRequests: () => apiCall('/report-requests'),
};

export default reportService;
