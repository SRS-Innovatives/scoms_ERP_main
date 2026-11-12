// Certificate / Document Service — /api/v1/student/certificates
import apiCall from './api';

export const certificateService = {
  getMyCertificates: async () => apiCall('/certificates'),
  getMyCertificateRequests: async () => apiCall('/certificate-requests'),
  // Types this institution has enabled — the request form's options
  getRequestableTypes: async () => apiCall('/certificate-types'),
  requestCertificate: async (type, reason) => apiCall('/certificate-requests', { method: 'POST', body: { type, reason } }),
};

export default certificateService;
