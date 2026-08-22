import { apiCall } from './api';

export const userService = {
  getUsers: async () => {
    return apiCall('/api/v1/super-admin/users');
  }
};

export default userService;
