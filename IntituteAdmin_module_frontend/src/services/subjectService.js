// Subject Service — /api/v1/admin/setup/subjects
// Subjects are created once, institution-wide, then mapped to whichever classes teach
// them (see the class-mapping methods below) — a subject is never tied to one course.
import apiCall from './api';

const getAll = (courseId) => apiCall(`/setup/subjects${courseId ? `?courseId=${courseId}` : ''}`);

const create = (payload) => apiCall('/setup/subjects', { method: 'POST', body: payload });

const update = (id, payload) => apiCall(`/setup/subjects/${id}`, { method: 'PATCH', body: payload });

const remove = (id) => apiCall(`/setup/subjects/${id}`, { method: 'DELETE' });

const bulkUpload = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiCall('/setup/subjects/bulk-upload', { method: 'POST', body: formData });
};

const getClassMappingOverview = () => apiCall('/setup/subjects/class-mapping');

const setClassMapping = (subjectId, courseIds) =>
  apiCall(`/setup/subjects/${subjectId}/class-mapping`, { method: 'PUT', body: { courseIds } });

export const subjectService = { getAll, create, update, remove, bulkUpload, getClassMappingOverview, setClassMapping };
export default subjectService;
