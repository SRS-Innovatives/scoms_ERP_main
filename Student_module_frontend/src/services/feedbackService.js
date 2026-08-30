// Anonymous Course Feedback Service — /api/v1/student/feedback/*
import apiCall from './api';

export const feedbackService = {
  getFeedbackSubjects: async () => apiCall('/feedback/subjects'),
  submitFeedback: async (subjectId, rating, comments) => apiCall('/feedback', { method: 'POST', body: { subjectId, rating, comments } }),
};

export default feedbackService;
