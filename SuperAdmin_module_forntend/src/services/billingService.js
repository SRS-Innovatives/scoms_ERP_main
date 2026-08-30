import { apiCall } from './api';

export const billingService = {
  getInvoices: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/api/v1/super-admin/invoices${query ? '?' + query : ''}`);
  },
  getInvoiceById: async (id) => {
    return apiCall(`/api/v1/super-admin/invoices/${id}`);
  },
  generateInvoice: async (data) => {
    return apiCall('/api/v1/super-admin/invoices', { method: 'POST', body: data });
  },
  updateInvoiceStatus: async (id, status, paymentMode) => {
    return apiCall(`/api/v1/super-admin/invoices/${id}/status`, { method: 'PATCH', body: { status, paymentMode } });
  },
  getBillingStats: async () => {
    return apiCall('/api/v1/super-admin/billing-stats');
  },
  getGstProfile: async () => {
    return apiCall('/api/v1/super-admin/billing/gst-profile');
  },
  updateGstProfile: async (data) => {
    return apiCall('/api/v1/super-admin/billing/gst-profile', { method: 'PUT', body: data });
  },
};

export default billingService;
