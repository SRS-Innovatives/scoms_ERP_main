// Fee Collection Desk Service (Accountant) — /api/v1/staff/fee-desk/*
import apiCall from './api';

export const feeDeskService = {
  getStructures: async () => apiCall('/fee-desk/structures'),
  getAssignments: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/fee-desk/assignments${qs ? `?${qs}` : ''}`);
  },
  getPendingFees: async () => apiCall('/fee-desk/pending'),
  getDashboard: async () => apiCall('/fee-desk/dashboard'),
  getDayBook: async (date) => apiCall(`/fee-desk/daybook${date ? `?date=${date}` : ''}`),
  collectFee: async (payload) => apiCall('/fee-desk/collect', { method: 'POST', body: payload }),
  getReceipt: async (id) => apiCall(`/fee-desk/receipts/${id}`),
  getChallans: async () => apiCall('/fee-desk/challans'),
  createChallan: async (payload) => apiCall('/fee-desk/challans', { method: 'POST', body: payload }),
  getRefunds: async () => apiCall('/fee-desk/refunds'),
  createRefund: async (payload) => apiCall('/fee-desk/refunds', { method: 'POST', body: payload }),
  processRefund: async (id, status) => apiCall(`/fee-desk/refunds/${id}`, { method: 'PATCH', body: { status } }),
};

export default feeDeskService;
