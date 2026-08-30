// Timetable Service — /api/v1/admin/timetable/*
import apiCall from './api';

const getForSection = (sectionId) => apiCall(`/timetable?sectionId=${sectionId}`);

const saveEntries = (timetableId, entries) => apiCall(`/timetable/${timetableId}/entries`, { method: 'PUT', body: { entries } });

const getForTeacher = (staffId) => apiCall(`/timetable/teacher/${staffId}`);

export const timetableService = { getForSection, saveEntries, getForTeacher };
export default timetableService;
