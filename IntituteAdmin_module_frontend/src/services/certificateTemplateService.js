// Dynamic Certificate Engine Service — /api/v1/admin/certificate-templates/*
import apiCall from './api';

export const certificateTemplateService = {
  getCatalog: () => apiCall('/certificate-templates/catalog'),
  getDefinition: (code) => apiCall(`/certificate-templates/${code}/definition`),
  getFormatSettings: (code) => apiCall(`/certificate-templates/${code}/format`),
  updateFormatSettings: (code, payload) => apiCall(`/certificate-templates/${code}/format`, { method: 'PATCH', body: payload }),
  resetFormatSettings: (code) => apiCall(`/certificate-templates/${code}/format/reset`, { method: 'POST' }),
  generate: (code, studentId, manualFields) => apiCall(`/certificate-templates/${code}/generate`, { method: 'POST', body: { studentId, manualFields } }),
};

export default certificateTemplateService;
