// Library Service — /api/v1/admin/library/*
import apiCall from './api';

const getBooks = () => apiCall('/library/books');
const createBook = (payload) => apiCall('/library/books', { method: 'POST', body: payload });

const issueBook = (payload) => apiCall('/library/issue', { method: 'POST', body: payload });
const getActiveIssues = () => apiCall('/library/issues');
const returnBook = (issueId) => apiCall('/library/return', { method: 'POST', body: { issueId } });

const getFines = () => apiCall('/library/fines');
const collectFine = (id) => apiCall(`/library/fines/${id}/collect`, { method: 'PATCH' });

const getReports = () => apiCall('/library/reports');

export const libraryService = {
  getBooks, createBook,
  issueBook, getActiveIssues, returnBook,
  getFines, collectFine,
  getReports,
};
export default libraryService;
