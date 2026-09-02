import { apiCall } from './api';

export const securityService = {
  getOverview: async () => {
    return apiCall('/api/v1/super-admin/security/overview');
  }
};

export default securityService;
