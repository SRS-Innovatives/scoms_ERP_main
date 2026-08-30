// Appointment Booking Service — /api/v1/student/appointments/*
import apiCall from './api';

export const appointmentService = {
  getTeachers: async () => apiCall('/appointments/teachers'),
  getMyAppointments: async () => apiCall('/appointments'),
  bookAppointment: async (payload) => apiCall('/appointments', { method: 'POST', body: payload }),
};

export default appointmentService;
