// Timetable Service — /api/v1/staff/timetable/*
import apiCall from './api';

export const timetableService = {
  getMyTimetable: async () => apiCall('/timetable/my'),
};

export default timetableService;
