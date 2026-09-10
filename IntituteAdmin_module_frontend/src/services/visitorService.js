// Visitor / Gate Management Service — /api/v1/admin/visitors/*
import apiCall from './api';

const getAll = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/visitors${query ? `?${query}` : ''}`);
};
const checkIn = (payload) => apiCall('/visitors', { method: 'POST', body: payload });
const checkOut = (id) => apiCall(`/visitors/${id}/checkout`, { method: 'PATCH' });

export const visitorService = { getAll, checkIn, checkOut };
export default visitorService;
