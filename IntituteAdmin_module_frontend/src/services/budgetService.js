// Budget Management Service — /api/v1/admin/budgets
import apiCall from './api';

const getBudgets = (period) => apiCall(`/budgets${period ? `?period=${period}` : ''}`);
const saveBudget = (payload) => apiCall('/budgets', { method: 'POST', body: payload });
const deleteBudget = (id) => apiCall(`/budgets/${id}`, { method: 'DELETE' });
const getVsActual = (period, from, to) => apiCall(`/budgets/vs-actual?period=${period}&from=${from}&to=${to}`);

export const budgetService = { getBudgets, saveBudget, deleteBudget, getVsActual };
export default budgetService;
