// SMS Broadcast Center & History Service — /api/v1/staff/sms/*
import apiCall from './api';

export const smsService = {
  broadcastToSection: async (sectionId, message) => apiCall('/sms/broadcast', { method: 'POST', body: { sectionId, message } }),
  sendToParent: async (studentId, phone, message) => apiCall('/sms/send-to-parent', { method: 'POST', body: { studentId, phone, message } }),
  getMyHistory: async () => apiCall('/sms/history'),
  getParentContacts: async () => apiCall('/sms/parent-contacts'),
};

export default smsService;
