import { apiCall } from './api';

// Feature Flags — platform-wide switches (online payments, SMS, WhatsApp, email, mobile apps)
export const featureFlagService = {
  getAll: async () => apiCall('/api/v1/super-admin/feature-flags'),
  set: async (key, enabled) => apiCall(`/api/v1/super-admin/feature-flags/${key}`, { method: 'PUT', body: { enabled } }),
};

export default featureFlagService;
