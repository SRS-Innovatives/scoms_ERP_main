// Settings Service — /api/v1/admin/settings/*
import apiCall from './api';

const getAuditLogs = (module) => apiCall(`/settings/audit-logs${module ? `?module=${module}` : ''}`);
const getUserRoles = () => apiCall('/settings/roles');
const getPermissionMatrix = () => apiCall('/settings/permissions');
const getSettings = () => apiCall('/settings');
const updateSettings = (payload) => apiCall('/settings', { method: 'PATCH', body: payload });
const requestBackup = () => apiCall('/settings/backup', { method: 'POST' });

export const settingsService = { getAuditLogs, getUserRoles, getPermissionMatrix, getSettings, updateSettings, requestBackup };
export default settingsService;
