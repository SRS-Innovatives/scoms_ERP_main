// Timetable Service — /api/v1/admin/timetable/*
import apiCall from './api';

const getForSection = (sectionId) => apiCall(`/timetable?sectionId=${sectionId}`);

const saveEntries = (timetableId, entries, allowConflicts = false) =>
  apiCall(`/timetable/${timetableId}/entries`, { method: 'PUT', body: { entries, ...(allowConflicts && { allowConflicts: true }) } });

const getForTeacher = (staffId) => apiCall(`/timetable/teacher/${staffId}`);

const getSubstituteRequests = (status) => apiCall(`/timetable/substitutes${status ? `?status=${status}` : ''}`);
const getAvailableSubstitutes = (id) => apiCall(`/timetable/substitutes/${id}/available`);
const reviewSubstituteRequest = (id, body) => apiCall(`/timetable/substitutes/${id}/review`, { method: 'POST', body });

export const timetableService = { getForSection, saveEntries, getForTeacher, getSubstituteRequests, getAvailableSubstitutes, reviewSubstituteRequest };
export default timetableService;
