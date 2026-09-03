// Auth Service — /api/v1/admin/auth/*
import apiCall from './api';

const getMe = () => apiCall('/auth/me');
const updateProfile = (payload) => apiCall('/auth/profile', { method: 'PATCH', body: payload });
const changePassword = (payload) => apiCall('/auth/change-password', { method: 'POST', body: payload });

export const authService = { getMe, updateProfile, changePassword };
export default authService;
