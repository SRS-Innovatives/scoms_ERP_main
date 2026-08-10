import { mockInvoices, mockBillingStats } from '../data/mockBillingData';
import { apiCall } from './api';

export const billingService = {
  getInvoices: async () => {
    return apiCall('/api/super-admin/invoices', { mockResponse: mockInvoices });
  },
  getBillingStats: async () => {
    return apiCall('/api/super-admin/billing-stats', { mockResponse: mockBillingStats });
  }
};

export default billingService;
