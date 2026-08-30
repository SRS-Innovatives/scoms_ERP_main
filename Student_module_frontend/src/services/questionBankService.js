// Question Bank Service — /api/v1/student/question-bank
import apiCall from './api';

export const questionBankService = {
  getQuestions: async () => apiCall('/question-bank'),
};

export default questionBankService;
