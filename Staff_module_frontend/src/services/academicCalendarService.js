// Academic Calendar Service — /api/v1/staff/academic-calendar (read-only)
import apiCall from './api';

export const academicCalendarService = {
  getEvents: async (from, to) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return apiCall(`/academic-calendar${qs ? `?${qs}` : ''}`);
  },
};

export default academicCalendarService;
