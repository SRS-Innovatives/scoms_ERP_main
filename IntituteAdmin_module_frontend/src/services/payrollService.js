// Payroll Service — /api/v1/admin/payroll/*
import apiCall from './api';

const getAll = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/payroll${query ? `?${query}` : ''}`);
};
const generate = (payload) => apiCall('/payroll', { method: 'POST', body: payload });
const markPaid = (id) => apiCall(`/payroll/${id}/pay`, { method: 'PATCH' });
const remove = (id) => apiCall(`/payroll/${id}`, { method: 'DELETE' });

export const payrollService = { getAll, generate, markPaid, remove };
export default payrollService;
