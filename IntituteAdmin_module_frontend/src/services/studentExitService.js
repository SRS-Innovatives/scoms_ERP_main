// Student Withdrawal / Transfer Service — /api/v1/admin/students/exits
import apiCall from './api';

const getExitRecords = (status) => apiCall(`/students/exits${status ? `?status=${status}` : ''}`);
const requestExit = (payload) => apiCall('/students/exits', { method: 'POST', body: payload });
const getClearanceStatus = (id) => apiCall(`/students/exits/${id}/clearance`);
const updateClearance = (id, payload) => apiCall(`/students/exits/${id}/clearance`, { method: 'PATCH', body: payload });
const approveExit = (id) => apiCall(`/students/exits/${id}/approve`, { method: 'POST' });
const completeExit = (id) => apiCall(`/students/exits/${id}/complete`, { method: 'POST' });
const cancelExit = (id) => apiCall(`/students/exits/${id}/cancel`, { method: 'POST' });

export const studentExitService = { getExitRecords, requestExit, getClearanceStatus, updateClearance, approveExit, completeExit, cancelExit };
export default studentExitService;
