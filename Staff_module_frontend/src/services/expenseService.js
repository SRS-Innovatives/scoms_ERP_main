// Expense Logging Service (Accountant) — /api/v1/staff/expenses/*
import apiCall from './api';

export const expenseService = {
  getExpenses: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/expenses${qs ? `?${qs}` : ''}`);
  },
  getSummary: async () => apiCall('/expenses/summary'),
  createExpense: async (payload) => apiCall('/expenses', { method: 'POST', body: payload }),
  deleteExpense: async (id) => apiCall(`/expenses/${id}`, { method: 'DELETE' }),
};

export default expenseService;
