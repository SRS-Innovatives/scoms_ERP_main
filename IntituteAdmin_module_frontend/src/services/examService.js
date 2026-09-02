// Examination Service — /api/v1/admin/exams, /exam-schedules
import apiCall from './api';

const getExams = () => apiCall('/exams');
const createExam = (payload) => apiCall('/exams', { method: 'POST', body: payload });
const updateExamStatus = (id, status) => apiCall(`/exams/${id}/status`, { method: 'PATCH', body: { status } });
const getRankList = (examId) => apiCall(`/exams/${examId}/rank-list`);

const getSchedules = (examId) => apiCall(`/exam-schedules${examId ? `?examId=${examId}` : ''}`);
const createSchedule = (payload) => apiCall('/exam-schedules', { method: 'POST', body: payload });
const deleteSchedule = (id) => apiCall(`/exam-schedules/${id}`, { method: 'DELETE' });
const getMarksRoster = (scheduleId) => apiCall(`/exam-schedules/${scheduleId}/marks`);
const saveMarks = (scheduleId, marks) => apiCall(`/exam-schedules/${scheduleId}/marks`, { method: 'POST', body: { marks } });
const publishResults = (scheduleId) => apiCall(`/exam-schedules/${scheduleId}/publish`, { method: 'POST' });

export const examService = {
  getExams, createExam, updateExamStatus, getRankList,
  getSchedules, createSchedule, deleteSchedule, getMarksRoster, saveMarks, publishResults,
};
export default examService;
