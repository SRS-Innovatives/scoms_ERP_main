// Official Marksheet Service — /api/v1/admin/students/:studentId/marksheet
import apiCall from './api';

const getMarksheet = (studentId, examId) => apiCall(`/students/${studentId}/marksheet?examId=${examId}`);

export const marksheetService = { getMarksheet };
export default marksheetService;
