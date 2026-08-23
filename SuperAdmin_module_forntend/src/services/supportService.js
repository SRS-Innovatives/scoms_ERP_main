import { apiCall } from './api';

export const supportService = {
  getTickets: async () => {
    return apiCall('/api/v1/super-admin/tickets');
  }
};

export default supportService;
