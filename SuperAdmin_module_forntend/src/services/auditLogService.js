import { apiCall } from './api';

export const auditLogService = {
  // the modules that actually have audit records (with counts), optionally for one institution
  getModules: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/api/v1/super-admin/audit-logs/modules${query ? '?' + query : ''}`);
  },
  getAuditLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/api/v1/super-admin/audit-logs${query ? '?' + query : ''}`);
  }
};

export default auditLogService;
