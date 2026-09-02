import { apiCall } from './api';

export const userService = {
  getUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/api/v1/super-admin/users${query ? `?${query}` : ''}`);
  },

  getRoles: async () => {
    return apiCall('/api/v1/super-admin/roles');
  },

  getRolePermissions: async (role) => {
    return apiCall(`/api/v1/super-admin/roles/${role}/permissions`);
  },

  updateRolePermissions: async (role, permissions) => {
    return apiCall(`/api/v1/super-admin/roles/${role}/permissions`, {
      method: 'PUT',
      body: { permissions }
    });
  }
};

export default userService;
