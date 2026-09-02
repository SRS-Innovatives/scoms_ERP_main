import { apiCall } from './api';

export const supportService = {
  getTickets: async () => {
    return apiCall('/api/v1/super-admin/tickets');
  },
  updateTicket: async (id, payload) => {
    return apiCall(`/api/v1/super-admin/tickets/${id}`, { method: 'PATCH', body: payload });
  }
};

export default supportService;
