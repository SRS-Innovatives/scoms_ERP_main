// Hostel Desk Service (Hostel Warden) — /api/v1/staff/hostel/*
import apiCall from './api';

export const hostelDeskService = {
  getHostels: async () => apiCall('/hostel/hostels'),
  createHostel: async (payload) => apiCall('/hostel/hostels', { method: 'POST', body: payload }),
  getBeds: async (hostelId) => apiCall(`/hostel/beds${hostelId ? `?hostelId=${hostelId}` : ''}`),
  createBed: async (payload) => apiCall('/hostel/beds', { method: 'POST', body: payload }),
  allocateBed: async (payload) => apiCall('/hostel/beds/allocate', { method: 'POST', body: payload }),
  vacateBed: async (id) => apiCall(`/hostel/beds/${id}/vacate`, { method: 'PATCH' }),
  getAttendance: async (date) => apiCall(`/hostel/attendance${date ? `?date=${date}` : ''}`),
  markAttendance: async (records, date) => apiCall('/hostel/attendance', { method: 'POST', body: { records, date } }),
  getVisitors: async () => apiCall('/hostel/visitors'),
  checkInVisitor: async (payload) => apiCall('/hostel/visitors/checkin', { method: 'POST', body: payload }),
  checkOutVisitor: async (id) => apiCall(`/hostel/visitors/${id}/checkout`, { method: 'PATCH' }),
};

export default hostelDeskService;
