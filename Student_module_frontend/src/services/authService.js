// Auth Service — /api/v1/student/auth/*
import apiCall from './api';

const getMe = () => apiCall('/auth/me');

const changePassword = (oldPassword, newPassword) =>
  apiCall('/auth/change-password', { method: 'POST', body: { oldPassword, newPassword } });

export const authService = { getMe, changePassword };
export default authService;
