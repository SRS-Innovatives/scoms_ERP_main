import { apiCall } from './api';

export const supportService = {
  getTickets: async () => {
    return apiCall('/api/v1/super-admin/tickets');
  },
  // tickets still waiting on support (OPEN + IN_PROGRESS) — the Support Desk menu badge
  getOpenCount: async () => apiCall('/api/v1/super-admin/tickets/open-count'),
  updateTicket: async (id, payload) => {
    return apiCall(`/api/v1/super-admin/tickets/${id}`, { method: 'PATCH', body: payload });
  }
};

export default supportService;
