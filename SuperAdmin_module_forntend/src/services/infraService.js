import { apiCall } from './api';

// System → Database & Backups, Storage, API Management — real figures from the server
export const infraService = {
  getDatabase: async () => apiCall('/api/v1/super-admin/system/database'),
  getStorage: async (refresh = false) => apiCall(`/api/v1/super-admin/system/storage${refresh ? '?refresh=1' : ''}`),
  getApi: async () => apiCall('/api/v1/super-admin/system/api'),
};

export const formatBytes = (b) => {
  const n = Number(b || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
};

export default infraService;
