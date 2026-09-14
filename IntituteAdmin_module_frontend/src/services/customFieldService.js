// Generalized Custom Field Service — /api/v1/admin/custom-fields/*
// entityType picks which form a field belongs to (ADMISSION, STAFF_PROFILE, ...) —
// same approval lifecycle, same endpoints, every entity type just filters by it.
import apiCall from './api';

const getAll = (entityType = 'ADMISSION') => apiCall(`/custom-fields?entityType=${entityType}`);
const getApproved = (entityType = 'ADMISSION') => apiCall(`/custom-fields/approved?entityType=${entityType}`);
const create = (payload, entityType = 'ADMISSION') => apiCall('/custom-fields', { method: 'POST', body: { ...payload, entityType } });
const update = (id, payload) => apiCall(`/custom-fields/${id}`, { method: 'PATCH', body: payload });
const remove = (id) => apiCall(`/custom-fields/${id}`, { method: 'DELETE' });
const submitForApproval = (entityType = 'ADMISSION', fieldIds) =>
  apiCall('/custom-fields/submit', { method: 'POST', body: { entityType, ...(fieldIds && { fieldIds }) } });

export const customFieldService = { getAll, getApproved, create, update, remove, submitForApproval };
export default customFieldService;
