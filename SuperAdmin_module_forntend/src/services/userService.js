import { mockUsers } from '../data/mockUsersData';
import { apiCall } from './api';

export const userService = {
  getUsers: async () => {
    return apiCall('/api/super-admin/users', { mockResponse: mockUsers });
  }
};

export default userService;
