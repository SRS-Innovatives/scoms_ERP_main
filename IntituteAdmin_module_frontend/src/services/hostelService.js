// Hostel Service — /api/v1/admin/hostel/*
import apiCall from './api';

const getHostels = () => apiCall('/hostel/hostels');
const createHostel = (payload) => apiCall('/hostel/hostels', { method: 'POST', body: payload });

const getBeds = (hostelId) => apiCall(`/hostel/beds${hostelId ? `?hostelId=${hostelId}` : ''}`);
const createBed = (payload) => apiCall('/hostel/beds', { method: 'POST', body: payload });
const allocateBed = (payload) => apiCall('/hostel/beds/allocate', { method: 'POST', body: payload });
const vacateBed = (id) => apiCall(`/hostel/beds/${id}/vacate`, { method: 'PATCH' });

const getAttendance = (date) => apiCall(`/hostel/attendance${date ? `?date=${date}` : ''}`);
const markAttendance = (records, date) => apiCall('/hostel/attendance', { method: 'POST', body: { records, date } });

const getMessFees = () => apiCall('/hostel/mess-fees');

const getVisitors = () => apiCall('/hostel/visitors');
const checkInVisitor = (payload) => apiCall('/hostel/visitors/checkin', { method: 'POST', body: payload });
const checkOutVisitor = (id) => apiCall(`/hostel/visitors/${id}/checkout`, { method: 'PATCH' });

export const hostelService = {
  getHostels, createHostel,
  getBeds, createBed, allocateBed, vacateBed,
  getAttendance, markAttendance,
  getMessFees,
  getVisitors, checkInVisitor, checkOutVisitor,
};
export default hostelService;
