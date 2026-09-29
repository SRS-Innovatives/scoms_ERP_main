// Module Configuration Service — /api/v1/admin/module-config
import apiCall from './api';

const getAssignedModules = () => apiCall('/module-config');
const getModuleConfig = (moduleKey) => apiCall(`/module-config/${moduleKey}`);
const updateModuleConfig = (moduleKey, config) => apiCall(`/module-config/${moduleKey}`, { method: 'PATCH', body: { config } });

export const moduleConfigService = { getAssignedModules, getModuleConfig, updateModuleConfig };
export default moduleConfigService;
