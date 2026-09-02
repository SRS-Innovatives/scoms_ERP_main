// Timetable Service — /api/v1/student/timetable
import apiCall from './api';

export const timetableService = {
  getTimetable: async () => apiCall('/timetable'),
};

export default timetableService;
