// Anonymous Feedback Aggregates Service — /api/v1/admin/feedback/summary
import apiCall from './api';

const getSummary = () => apiCall('/feedback/summary');

export const feedbackService = { getSummary };
export default feedbackService;
