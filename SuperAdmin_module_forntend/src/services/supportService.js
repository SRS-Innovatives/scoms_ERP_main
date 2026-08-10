import { mockSupportTickets } from '../data/mockSupportData';
import { apiCall } from './api';

export const supportService = {
  getTickets: async () => {
    return apiCall('/api/super-admin/tickets', { mockResponse: mockSupportTickets });
  }
};

export default supportService;
