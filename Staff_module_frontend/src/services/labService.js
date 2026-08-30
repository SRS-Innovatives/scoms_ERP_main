// Lab Equipment Service — /api/v1/staff/lab/*
import apiCall from './api';

export const labService = {
  getAssets: async () => apiCall('/lab/assets'),
  createAsset: async (payload) => apiCall('/lab/assets', { method: 'POST', body: payload }),
  getIssuedEquipment: async () => apiCall('/lab/issues'),
  issueEquipment: async (payload) => apiCall('/lab/issue', { method: 'POST', body: payload }),
  returnEquipment: async (issueId) => apiCall(`/lab/issues/${issueId}/return`, { method: 'PATCH' }),
};

export default labService;
