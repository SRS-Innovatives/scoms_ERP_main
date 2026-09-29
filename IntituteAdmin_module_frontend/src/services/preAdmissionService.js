// Pre-Admission / Application Form Service — /api/v1/admin/pre-admission/*
import apiCall from './api';

const getAll = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/pre-admission/applications${query ? `?${query}` : ''}`);
};
const getById = (id) => apiCall(`/pre-admission/applications/${id}`);
const create = (payload) => apiCall('/pre-admission/applications', { method: 'POST', body: payload });
const updateStatus = (id, payload) => apiCall(`/pre-admission/applications/${id}/status`, { method: 'PATCH', body: payload });
const generateReceipt = (id) => apiCall(`/pre-admission/applications/${id}/receipt`, { method: 'POST' });
const admit = (id, payload) => apiCall(`/pre-admission/applications/${id}/admit`, { method: 'POST', body: payload });
const remove = (id) => apiCall(`/pre-admission/applications/${id}`, { method: 'DELETE' });

const getApiKeySettings = () => apiCall('/pre-admission/settings/api-key');
const regenerateApiKey = () => apiCall('/pre-admission/settings/api-key/regenerate', { method: 'POST' });
const updateFeeAmount = (feeAmount) => apiCall('/pre-admission/settings/fee', { method: 'PATCH', body: { feeAmount } });

export const preAdmissionService = {
  getAll, getById, create, updateStatus, generateReceipt, admit, remove,
  getApiKeySettings, regenerateApiKey, updateFeeAmount,
};
export default preAdmissionService;
