// Examination Service — /api/v1/admin/exams, /exam-schedules
import apiCall from './api';

const getExams = () => apiCall('/exams');
const createExam = (payload) => apiCall('/exams', { method: 'POST', body: payload });
const updateExamStatus = (id, status) => apiCall(`/exams/${id}/status`, { method: 'PATCH', body: { status } });
const getRankList = (examId) => apiCall(`/exams/${examId}/rank-list`);
const getConsolidatedReport = (examId, sectionId) =>
  apiCall(`/exams/${examId}/consolidated-report${sectionId ? `?sectionId=${sectionId}` : ''}`);

const getSchedules = (examId) => apiCall(`/exam-schedules${examId ? `?examId=${examId}` : ''}`);
const createSchedule = (payload) => apiCall('/exam-schedules', { method: 'POST', body: payload });
const deleteSchedule = (id) => apiCall(`/exam-schedules/${id}`, { method: 'DELETE' });
const getMarksRoster = (scheduleId) => apiCall(`/exam-schedules/${scheduleId}/marks`);
const saveMarks = (scheduleId, marks) => apiCall(`/exam-schedules/${scheduleId}/marks`, { method: 'POST', body: { marks } });
const publishResults = (scheduleId) => apiCall(`/exam-schedules/${scheduleId}/publish`, { method: 'POST' });
const unlockSchedule = (scheduleId, reason) => apiCall(`/exam-schedules/${scheduleId}/unlock`, { method: 'POST', body: { reason } });
const importMarksCsv = (scheduleId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiCall(`/exam-schedules/${scheduleId}/import`, { method: 'POST', body: formData });
};

const submitMarks = (scheduleId) => apiCall(`/exam-schedules/${scheduleId}/submit`, { method: 'POST' });
const verifyMarks = (scheduleId) => apiCall(`/exam-schedules/${scheduleId}/verify`, { method: 'POST' });
const approveMarks = (scheduleId) => apiCall(`/exam-schedules/${scheduleId}/approve`, { method: 'POST' });
const returnMarks = (scheduleId, remarks) => apiCall(`/exam-schedules/${scheduleId}/return`, { method: 'POST', body: { remarks } });
const getReviewQueue = () => apiCall('/exam-review/queue');
const createCorrectionRequest = (scheduleId, payload) =>
  apiCall(`/exam-schedules/${scheduleId}/corrections`, { method: 'POST', body: payload });
const getCorrectionRequests = (status) => apiCall(`/exam-corrections${status ? `?status=${status}` : ''}`);
const reviewCorrectionRequest = (id, decision, remarks) =>
  apiCall(`/exam-corrections/${id}/review`, { method: 'POST', body: { decision, remarks } });

export const examService = {
  getExams, createExam, updateExamStatus, getRankList, getConsolidatedReport,
  getSchedules, createSchedule, deleteSchedule, getMarksRoster, saveMarks, publishResults,
  unlockSchedule, importMarksCsv,
  submitMarks, verifyMarks, approveMarks, returnMarks, getReviewQueue,
  createCorrectionRequest, getCorrectionRequests, reviewCorrectionRequest,
};
export default examService;
