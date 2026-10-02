// Fee & Payments Service — /api/v1/admin/fees/*
import apiCall from './api';

const getCategories = () => apiCall('/fees/categories');

const getStructures = () => apiCall('/fees/structures');
const createStructure = (payload) => apiCall('/fees/structures', { method: 'POST', body: payload });
const deleteStructure = (id) => apiCall(`/fees/structures/${id}`, { method: 'DELETE' });

const getAssignments = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiCall(`/fees/assignments${qs ? `?${qs}` : ''}`);
};
const assignFee = (payload) => apiCall('/fees/assignments', { method: 'POST', body: payload });
const bulkAssignFee = (payload) => apiCall('/fees/assignments/bulk', { method: 'POST', body: payload });

const getInstallments = () => apiCall('/fees/installments');
const createInstallmentPlan = (payload) => apiCall('/fees/installments', { method: 'POST', body: payload });

const collectFee = (payload) => apiCall('/fees/collect', { method: 'POST', body: payload });

const getReceipt = (id) => apiCall(`/fees/receipts/${id}`);

const getChallans = () => apiCall('/fees/challans');
const createChallan = (payload) => apiCall('/fees/challans', { method: 'POST', body: payload });

const getScholarships = () => apiCall('/fees/scholarships');
const applyScholarship = (assignmentId, payload) => apiCall(`/fees/assignments/${assignmentId}/scholarship`, { method: 'PATCH', body: payload });
const getConcessionSchemes = () => apiCall('/fees/concession-schemes');
const createConcessionScheme = (payload) => apiCall('/fees/concession-schemes', { method: 'POST', body: payload });
const updateConcessionScheme = (id, payload) => apiCall(`/fees/concession-schemes/${id}`, { method: 'PATCH', body: payload });
const deleteConcessionScheme = (id) => apiCall(`/fees/concession-schemes/${id}`, { method: 'DELETE' });
const getConcessions = (status) => apiCall(`/fees/concessions${status ? `?status=${status}` : ''}`);
const requestConcession = (payload) => apiCall('/fees/concessions', { method: 'POST', body: payload });
const reviewConcession = (id, decision, remarks) => apiCall(`/fees/concessions/${id}/review`, { method: 'POST', body: { decision, remarks } });
const revokeConcession = (id, remarks) => apiCall(`/fees/concessions/${id}/revoke`, { method: 'POST', body: { remarks } });

const getRefunds = () => apiCall('/fees/refunds');
const createRefund = (payload) => apiCall('/fees/refunds', { method: 'POST', body: payload });
const processRefund = (id, status) => apiCall(`/fees/refunds/${id}`, { method: 'PATCH', body: { status } });

const getPendingFees = () => apiCall('/fees/pending');
const getDashboard = () => apiCall('/fees/dashboard');
const getReports = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiCall(`/fees/reports${qs ? `?${qs}` : ''}`);
};
const getDayBook = (date) => apiCall(`/fees/daybook${date ? `?date=${date}` : ''}`);

export const feeService = {
  getCategories,
  getStructures, createStructure, deleteStructure,
  getAssignments, assignFee, bulkAssignFee,
  getInstallments, createInstallmentPlan,
  collectFee,
  getReceipt,
  getChallans, createChallan,
  getScholarships, applyScholarship,
  getConcessionSchemes, createConcessionScheme, updateConcessionScheme, deleteConcessionScheme,
  getConcessions, requestConcession, reviewConcession, revokeConcession,
  getRefunds, createRefund, processRefund,
  getPendingFees, getDashboard, getReports, getDayBook,
};
export default feeService;
