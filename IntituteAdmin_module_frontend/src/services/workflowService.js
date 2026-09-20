// Workflow Engine Service — /api/v1/admin/workflows
import apiCall from './api';

const getDefinitions = () => apiCall('/workflows/definitions');
const createDefinition = (payload) => apiCall('/workflows/definitions', { method: 'POST', body: payload });
const updateDefinition = (id, payload) => apiCall(`/workflows/definitions/${id}`, { method: 'PATCH', body: payload });
const getMyPendingApprovals = () => apiCall('/workflows/instances/my-approvals');
const getInstance = (id) => apiCall(`/workflows/instances/${id}`);
const decideStep = (id, payload) => apiCall(`/workflows/instances/${id}/decide`, { method: 'POST', body: payload });

export const workflowService = { getDefinitions, createDefinition, updateDefinition, getMyPendingApprovals, getInstance, decideStep };
export default workflowService;
