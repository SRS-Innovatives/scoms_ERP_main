// Grievance Service — /api/v1/admin/grievances
import apiCall from './api';

const getAll = () => apiCall('/grievances');

const update = (id, payload) => apiCall(`/grievances/${id}`, { method: 'PATCH', body: payload });

export const grievanceService = { getAll, update };
export default grievanceService;
