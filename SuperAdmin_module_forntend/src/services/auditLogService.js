import { apiCall } from './api';

export const auditLogService = {
  getAuditLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/api/v1/super-admin/audit-logs${query ? '?' + query : ''}`);
  }
};

export default auditLogService;
