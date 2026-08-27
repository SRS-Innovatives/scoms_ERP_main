// Auth Service — /api/v1/auth/*
import apiCall from './api';

const getMe = () => apiCall('/auth/me');

export const authService = { getMe };
export default authService;
