import { apiCall } from './api';

// Active Sessions — real signed-in sessions across every portal; revoke signs a device out
export const sessionService = {
  getSessions: async (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')).toString();
    return apiCall(`/api/v1/super-admin/sessions${query ? `?${query}` : ''}`);
  },
  revoke: async (id) => apiCall(`/api/v1/super-admin/sessions/${id}`, { method: 'DELETE' }),
  revokeUser: async (userId) => apiCall('/api/v1/super-admin/sessions/revoke-user', { method: 'POST', body: { userId } }),
};

export default sessionService;
