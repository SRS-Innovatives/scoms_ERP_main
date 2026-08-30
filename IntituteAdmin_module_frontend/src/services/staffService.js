// Staff Service — /api/v1/admin/staff/*
import apiCall from './api';

const getAll = (staffType) => apiCall(`/staff${staffType ? `?staffType=${staffType}` : ''}`);
const getById = (id) => apiCall(`/staff/${id}`);
const create = (payload) => apiCall('/staff', { method: 'POST', body: payload });
const update = (id, payload) => apiCall(`/staff/${id}`, { method: 'PATCH', body: payload });

const addQualification = (staffId, payload) => apiCall(`/staff/${staffId}/qualifications`, { method: 'POST', body: payload });
const addExperience = (staffId, payload) => apiCall(`/staff/${staffId}/experience`, { method: 'POST', body: payload });

const getSalaries = () => apiCall('/staff/salaries');
const setSalary = (staffId, payload) => apiCall(`/staff/${staffId}/salary`, { method: 'POST', body: payload });

const getAttendance = (date) => apiCall(`/staff/attendance${date ? `?date=${date}` : ''}`);
const markAttendance = (records, date) => apiCall('/staff/attendance', { method: 'POST', body: { records, date } });

const getLeaveRequests = (status) => apiCall(`/staff/leave${status ? `?status=${status}` : ''}`);
const createLeaveRequest = (payload) => apiCall('/staff/leave', { method: 'POST', body: payload });
const updateLeaveStatus = (id, status) => apiCall(`/staff/leave/${id}`, { method: 'PATCH', body: { status } });

const getTeacherAssignments = () => apiCall('/staff/assignments');
const assignTeacher = (payload) => apiCall('/staff/assignments', { method: 'POST', body: payload });

export const staffService = {
  getAll, getById, create, update,
  addQualification, addExperience,
  getSalaries, setSalary,
  getAttendance, markAttendance,
  getLeaveRequests, createLeaveRequest, updateLeaveStatus,
  getTeacherAssignments, assignTeacher,
};
export default staffService;
