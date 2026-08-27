import { apiCall } from './api';

export const userService = {
  getUsers: async () => {
    return apiCall('/api/v1/super-admin/users');
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
