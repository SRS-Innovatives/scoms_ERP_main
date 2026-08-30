// Student Messaging Service — /api/v1/staff/messages/*
import apiCall from './api';

export const messageService = {
  getStudents: async () => apiCall('/messages/students'),
  getConversation: async (withUserId) => apiCall(`/messages/conversation?withUserId=${withUserId}`),
  send: async (receiverId, content) => apiCall('/messages', { method: 'POST', body: { receiverId, content } }),
};

export default messageService;
