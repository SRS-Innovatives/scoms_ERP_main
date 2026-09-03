// Homework Service — /api/v1/admin/homework/*
import apiCall from './api';

const getAll = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/homework${query ? `?${query}` : ''}`);
};
const getById = (id) => apiCall(`/homework/${id}`);

export const homeworkService = { getAll, getById };
export default homeworkService;
