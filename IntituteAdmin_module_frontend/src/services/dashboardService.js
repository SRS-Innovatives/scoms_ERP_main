// Dashboard Service — /api/v1/admin/dashboard
import apiCall from './api';

const getDashboard = () => apiCall('/dashboard');

export const dashboardService = { getDashboard };
export default dashboardService;
