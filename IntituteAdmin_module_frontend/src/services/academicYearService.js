// Academic Year Service — /api/v1/setup/academic-years
import apiCall from './api';

const getAll = () => apiCall('/setup/academic-years');

const create = (payload) => apiCall('/setup/academic-years', { method: 'POST', body: payload });

const update = (id, payload) => apiCall(`/setup/academic-years/${id}`, { method: 'PATCH', body: payload });

const remove = (id) => apiCall(`/setup/academic-years/${id}`, { method: 'DELETE' });

export const academicYearService = { getAll, create, update, remove };
export default academicYearService;
