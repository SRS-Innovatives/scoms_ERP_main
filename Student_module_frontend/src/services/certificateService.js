// Certificate / Document Service — /api/v1/student/certificates
import apiCall from './api';

export const certificateService = {
  getMyCertificates: async () => apiCall('/certificates'),
  getMyCertificateRequests: async () => apiCall('/certificate-requests'),
  requestCertificate: async (type, reason) => apiCall('/certificate-requests', { method: 'POST', body: { type, reason } }),
};

export default certificateService;
