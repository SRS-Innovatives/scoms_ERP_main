// Fee & Payments Service — /api/v1/student/fees/*
import apiCall from './api';

export const feeService = {
  getFees: async () => apiCall('/fees'),
  // Fee Policy for this student: accepted amounts per fee, fee credit, holds
  getFeeStatus: async () => apiCall('/fees/status'),
  // menu badge: { state: OVERDUE | DUE | PAID, totalDue, pendingFees }
  getFeeBadge: async () => apiCall('/fees/badge'),
  initiatePayment: async (payload) => apiCall('/fees/pay/initiate', { method: 'POST', body: payload }),
  verifyPayment: async (payload) => apiCall('/fees/pay/verify', { method: 'POST', body: payload }),
  // Scholarship / concession applications (reviewed by the Institute Admin)
  getConcessionSchemes: async () => apiCall('/fees/concession-schemes'),
  getMyConcessions: async () => apiCall('/fees/concessions'),
  applyConcession: async (payload) => apiCall('/fees/concessions', { method: 'POST', body: payload }),
};

export default feeService;
