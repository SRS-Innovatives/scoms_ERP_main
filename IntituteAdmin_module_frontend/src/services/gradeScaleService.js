// Grade Scale (SGPA/CGPA point system) Service — /api/v1/admin/grade-scale/*
import apiCall from './api';

const getAll = () => apiCall('/grade-scale');
const seedDefault = () => apiCall('/grade-scale/seed-default', { method: 'POST' });
const create = (payload) => apiCall('/grade-scale', { method: 'POST', body: payload });
const update = (id, payload) => apiCall(`/grade-scale/${id}`, { method: 'PATCH', body: payload });
const remove = (id) => apiCall(`/grade-scale/${id}`, { method: 'DELETE' });

export const gradeScaleService = { getAll, seedDefault, create, update, remove };
export default gradeScaleService;
