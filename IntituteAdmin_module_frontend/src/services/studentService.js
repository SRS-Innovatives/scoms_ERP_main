// Student Service — /api/v1/admin/students
import apiCall from './api';

const getAll = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/students${query ? '?' + query : ''}`);
};

const getById = (id) => apiCall(`/students/${id}`);

const create = (payload) => apiCall('/students/admission', { method: 'POST', body: payload });

const promote = (studentIds, targetSectionId) => apiCall('/students/promote', { method: 'POST', body: { studentIds, targetSectionId } });

const downloadBulkTemplate = () => apiCall('/students/bulk-admission/template', { responseType: 'blob' });

const bulkUpload = (file, classAssignment) => {
  const formData = new FormData();
  formData.append('file', file);
  Object.entries(classAssignment).forEach(([key, value]) => {
    if (value) formData.append(key, value);
  });
  return apiCall('/students/bulk-admission', { method: 'POST', body: formData });
};

export const studentService = { getAll, getById, create, promote, downloadBulkTemplate, bulkUpload };
export default studentService;
