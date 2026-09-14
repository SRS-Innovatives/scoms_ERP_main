// Institution Custom Lists Service — /api/v1/admin/custom-lists/*
// Self-service picklists (Leave Types, Discipline Categories, Exam Types) — no
// SuperAdmin approval, institution manages these directly.
import apiCall from './api';

const getList = (listType) => apiCall(`/custom-lists?listType=${listType}`);
const getActive = (listType) => apiCall(`/custom-lists/active?listType=${listType}`);
const create = (listType, label) => apiCall('/custom-lists', { method: 'POST', body: { listType, label } });
const update = (id, payload) => apiCall(`/custom-lists/${id}`, { method: 'PATCH', body: payload });
const remove = (id) => apiCall(`/custom-lists/${id}`, { method: 'DELETE' });

export const customListService = { getList, getActive, create, update, remove };
export default customListService;
