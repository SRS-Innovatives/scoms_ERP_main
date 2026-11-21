// Late Fee Service — /api/v1/admin/fees/late-fees (Institute Admin only)
import apiCall from './api';

const getAll = (status = 'DUE') => apiCall(`/fees/late-fees?status=${status}`);
const collect = (assignmentId, payload) => apiCall(`/fees/late-fees/${assignmentId}/collect`, { method: 'POST', body: payload });
const waive = (assignmentId, payload) => apiCall(`/fees/late-fees/${assignmentId}/waive`, { method: 'POST', body: payload });

const lateFeeService = { getAll, collect, waive };
export default lateFeeService;
