// My Documents — /api/v1/student/documents (read-only; each row has fileUrl, a signed file link)
import apiCall from './api';

export const documentService = {
  getMyDocuments: async () => apiCall('/documents'),
};

export default documentService;
