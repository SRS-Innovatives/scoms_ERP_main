// Front Office / Admission Enquiry Service — /api/v1/admin/enquiries/*
import apiCall from './api';

const getAll = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/enquiries${query ? `?${query}` : ''}`);
};
const create = (payload) => apiCall('/enquiries', { method: 'POST', body: payload });
const update = (id, payload) => apiCall(`/enquiries/${id}`, { method: 'PATCH', body: payload });
const remove = (id) => apiCall(`/enquiries/${id}`, { method: 'DELETE' });

export const enquiryService = { getAll, create, update, remove };
export default enquiryService;
