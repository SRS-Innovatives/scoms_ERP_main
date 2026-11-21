// Student Documents Service — /api/v1/admin/students/:studentId/documents
import apiCall from './api';

const getForStudent = (studentId) => apiCall(`/students/${studentId}/documents`);
const getById = (id) => apiCall(`/students/documents/${id}`);
const upload = (studentId, payload) => apiCall(`/students/${studentId}/documents`, { method: 'POST', body: payload });
const remove = (id) => apiCall(`/students/documents/${id}`, { method: 'DELETE' });
// show / hide in the student's own My Documents (Student portal)
const setVisibility = (id, visibleToStudent) => apiCall(`/students/documents/${id}/visibility`, { method: 'PATCH', body: { visibleToStudent } });

export const studentDocumentService = { getForStudent, getById, upload, remove, setVisibility };
export default studentDocumentService;
