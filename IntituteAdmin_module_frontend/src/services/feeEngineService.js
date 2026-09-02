// Dynamic Fee Engine Service — /api/v1/admin/fee-heads/*, /fee-structures/*, /fee-payments, /fee-receipts/*
import apiCall from './api';

export const feeEngineService = {
  // Fee Categories
  getCategories: () => apiCall('/fee-heads/categories'),
  createCategory: (payload) => apiCall('/fee-heads/categories', { method: 'POST', body: payload }),

  // Fee Heads
  getFeeHeads: (active) => apiCall(`/fee-heads${active !== undefined ? `?active=${active}` : ''}`),
  createFeeHead: (payload) => apiCall('/fee-heads', { method: 'POST', body: payload }),
  updateFeeHead: (id, payload) => apiCall(`/fee-heads/${id}`, { method: 'PATCH', body: payload }),
  deactivateFeeHead: (id) => apiCall(`/fee-heads/${id}`, { method: 'DELETE' }),

  // Fee Structures
  getStructures: (status) => apiCall(`/fee-structures${status ? `?status=${status}` : ''}`),
  getStructureById: (id) => apiCall(`/fee-structures/${id}`),
  createStructure: (payload) => apiCall('/fee-structures', { method: 'POST', body: payload }),
  updateStructure: (id, payload) => apiCall(`/fee-structures/${id}`, { method: 'PATCH', body: payload }),
  publishStructure: (id) => apiCall(`/fee-structures/${id}/publish`, { method: 'POST' }),
  archiveStructure: (id) => apiCall(`/fee-structures/${id}/archive`, { method: 'POST' }),
  duplicateStructure: (id, payload) => apiCall(`/fee-structures/${id}/duplicate`, { method: 'POST', body: payload }),
  assignStructure: (id) => apiCall(`/fee-structures/${id}/assign`, { method: 'POST' }),

  // Student Fee Breakdown
  getStudentFeeItems: (studentId) => apiCall(`/students/${studentId}/fee-items`),

  // Multi-Item Payment
  collectPayment: (payload) => apiCall('/fee-payments', { method: 'POST', body: payload }),

  // Receipt Reprint
  reprintReceipt: (id) => apiCall(`/fee-receipts/${id}/reprint`, { method: 'POST' }),
};

export default feeEngineService;
