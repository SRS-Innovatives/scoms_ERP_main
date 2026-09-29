// Event/Automation Engine Service — /api/v1/admin/automation
import apiCall from './api';

const getRules = () => apiCall('/automation/rules');
const getEventTypes = () => apiCall('/automation/event-types');
const createRule = (payload) => apiCall('/automation/rules', { method: 'POST', body: payload });
const updateRule = (id, payload) => apiCall(`/automation/rules/${id}`, { method: 'PATCH', body: payload });
const deleteRule = (id) => apiCall(`/automation/rules/${id}`, { method: 'DELETE' });
const getEventHistory = (eventType) => apiCall(`/automation/events${eventType ? `?eventType=${eventType}` : ''}`);
const testFireEvent = (payload) => apiCall('/automation/test-fire', { method: 'POST', body: payload });

export const automationService = { getRules, getEventTypes, createRule, updateRule, deleteRule, getEventHistory, testFireEvent };
export default automationService;
