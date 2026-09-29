import { apiCall } from './api';

const BASE = '/api/v1/super-admin/module-registry';

export const moduleRegistryService = {
  getModules: async () => apiCall(BASE),

  getModuleById: async (id) => apiCall(`${BASE}/${id}`),

  createModule: async (data) => apiCall(BASE, { method: 'POST', body: data }),

  updateModule: async (id, data) => apiCall(`${BASE}/${id}`, { method: 'PATCH', body: data }),

  updateModuleStatus: async (id, status) => apiCall(`${BASE}/${id}/status`, { method: 'PATCH', body: { status } }),

  createModuleVersion: async (id, data) => apiCall(`${BASE}/${id}/versions`, { method: 'POST', body: data }),

  addModuleDependency: async (id, dependsOnModuleId) =>
    apiCall(`${BASE}/${id}/dependencies`, { method: 'POST', body: { dependsOnModuleId } }),

  removeModuleDependency: async (dependencyId) =>
    apiCall(`${BASE}/dependencies/${dependencyId}`, { method: 'DELETE' }),

  getAssignableInstitutions: async (id) => apiCall(`${BASE}/${id}/assignable-institutions`),

  assignModuleToInstitution: async (id, data) =>
    apiCall(`${BASE}/${id}/assignments`, { method: 'POST', body: data }),

  updateModuleAssignment: async (assignmentId, status) =>
    apiCall(`${BASE}/assignments/${assignmentId}`, { method: 'PATCH', body: { status } }),

  removeModuleAssignment: async (assignmentId) =>
    apiCall(`${BASE}/assignments/${assignmentId}`, { method: 'DELETE' }),
};

export default moduleRegistryService;
