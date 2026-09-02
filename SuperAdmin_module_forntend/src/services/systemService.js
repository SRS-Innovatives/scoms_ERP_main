import { apiCall } from './api';

export const systemService = {
  getHealth: async () => {
    return apiCall('/api/v1/super-admin/system/health');
  }
};

export default systemService;
