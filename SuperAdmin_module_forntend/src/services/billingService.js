import { apiCall } from './api';

export const billingService = {
  getInvoices: async () => {
    return apiCall('/api/v1/super-admin/invoices');
  },
  getBillingStats: async () => {
    return apiCall('/api/v1/super-admin/billing-stats');
  }
};

export default billingService;
