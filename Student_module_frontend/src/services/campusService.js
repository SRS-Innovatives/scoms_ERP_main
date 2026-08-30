// Campus Services — /api/v1/student/library, /transport, /hostel
import apiCall from './api';

export const campusService = {
  getMyLibrary: async () => apiCall('/library'),
  renewBook: async (issueId) => apiCall('/library/renew', { method: 'POST', body: { issueId } }),
  getMyTransport: async () => apiCall('/transport'),
  getMyHostel: async () => apiCall('/hostel'),
};

export default campusService;
