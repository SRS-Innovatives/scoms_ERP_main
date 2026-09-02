// Teacher Messaging Service — /api/v1/student/messages/*
import apiCall from './api';

export const messageService = {
  getTeachers: async () => apiCall('/messages/teachers'),
  getConversation: async (withUserId) => apiCall(`/messages/conversation?withUserId=${withUserId}`),
  send: async (receiverId, content) => apiCall('/messages', { method: 'POST', body: { receiverId, content } }),
};

export default messageService;
