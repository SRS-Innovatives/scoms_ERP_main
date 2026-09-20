// Notification Scheduler Service — /api/v1/admin/notifications/scheduled
import apiCall from './api';

const getScheduled = () => apiCall('/notifications/scheduled');
const createScheduled = (payload) => apiCall('/notifications/scheduled', { method: 'POST', body: payload });
const cancelScheduled = (id) => apiCall(`/notifications/scheduled/${id}`, { method: 'DELETE' });

export const notificationSchedulerService = { getScheduled, createScheduled, cancelScheduled };
export default notificationSchedulerService;
