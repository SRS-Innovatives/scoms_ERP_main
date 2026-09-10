// Research & Publications Oversight Service — /api/v1/admin/research
import apiCall from './api';

const getAll = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/research${query ? `?${query}` : ''}`);
};

export const researchService = { getAll };
export default researchService;
