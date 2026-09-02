// Fee & Payments Service — /api/v1/student/fees/*
import apiCall from './api';

export const feeService = {
  getFees: async () => apiCall('/fees'),
  initiatePayment: async (payload) => apiCall('/fees/pay/initiate', { method: 'POST', body: payload }),
  verifyPayment: async (payload) => apiCall('/fees/pay/verify', { method: 'POST', body: payload }),
};

export default feeService;
