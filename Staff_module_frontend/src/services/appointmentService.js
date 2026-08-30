// Appointment Requests Service — /api/v1/staff/appointments/*
import apiCall from './api';

export const appointmentService = {
  getMyAppointments: async () => apiCall('/appointments'),
  updateStatus: async (id, status) => apiCall(`/appointments/${id}`, { method: 'PATCH', body: { status } }),
};

export default appointmentService;
