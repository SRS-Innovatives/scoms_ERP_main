import { apiCall } from './api';

export const systemService = {
  getHealth: async () => {
    return apiCall('/api/v1/super-admin/system/health');
  },
  getIntegrationProviders: async () => {
    return apiCall('/api/v1/super-admin/integrations/providers');
  },
  registerIntegrationProvider: async (data) => {
    return apiCall('/api/v1/super-admin/integrations/providers', { method: 'POST', body: data });
  },
  updateIntegrationProvider: async (id, data) => {
    return apiCall(`/api/v1/super-admin/integrations/providers/${id}`, { method: 'PATCH', body: data });
  },
};

export default systemService;
