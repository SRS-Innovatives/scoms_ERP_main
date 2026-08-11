import { mockFeeLedger, mockFeeReceipts } from '../data/mockStudentData';
import { apiCall } from './api';

export const feeService = {
  getFees: async () => apiCall('/api/student/fees', { mockResponse: mockFeeLedger }),
  getReceipts: async () => apiCall('/api/student/receipts', { mockResponse: mockFeeReceipts })
};

export default feeService;
