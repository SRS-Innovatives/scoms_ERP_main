// Expense Management Service — /api/v1/admin/expenses
import apiCall from './api';

const getExpenses = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/expenses${query ? `?${query}` : ''}`);
};
const getSummary = () => apiCall('/expenses/summary');
const createExpense = (payload) => apiCall('/expenses', { method: 'POST', body: payload });
const approveExpense = (id) => apiCall(`/expenses/${id}/approve`, { method: 'PATCH' });
const rejectExpense = (id, reason) => apiCall(`/expenses/${id}/reject`, { method: 'PATCH', body: { reason } });
const markPaid = (id) => apiCall(`/expenses/${id}/pay`, { method: 'PATCH' });
const deleteExpense = (id) => apiCall(`/expenses/${id}`, { method: 'DELETE' });

export const expenseService = { getExpenses, getSummary, createExpense, approveExpense, rejectExpense, markPaid, deleteExpense };
export default expenseService;
