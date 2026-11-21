// Fee Policy Service — /api/v1/admin/fees/policy and friends (Institute Admin only):
// payment rules, one fee's own rules, holds + exemptions, fee credit, reminders.
import apiCall from './api';

const getPolicy = () => apiCall('/fees/policy');
const savePolicy = (payload) => apiCall('/fees/policy', { method: 'PUT', body: payload });
const setStructurePolicy = (structureId, policyOverride) => apiCall(`/fee-structures/${structureId}/policy`, { method: 'PUT', body: { policyOverride } });

const getStudentStatus = (studentId) => apiCall(`/fees/students/${studentId}/policy-status`);
const useCredit = (studentId, payload = {}) => apiCall(`/fees/students/${studentId}/credit/use`, { method: 'POST', body: payload });
const refundCredit = (studentId, payload) => apiCall(`/fees/students/${studentId}/credit/refund`, { method: 'POST', body: payload });
const transferCredit = (studentId, payload) => apiCall(`/fees/students/${studentId}/credit/transfer`, { method: 'POST', body: payload });
const getCredits = () => apiCall('/fees/credits');

const getHolds = () => apiCall('/fees/holds');
const getExemptions = (includeInactive = false) => apiCall(`/fees/hold-exemptions${includeInactive ? '?includeInactive=true' : ''}`);
const createExemption = (payload) => apiCall('/fees/hold-exemptions', { method: 'POST', body: payload });
const revokeExemption = (id) => apiCall(`/fees/hold-exemptions/${id}/revoke`, { method: 'POST' });

// previous-year dues: a student allowed to pay later fees anyway (until a date)
const getDuesExceptions = (includeInactive = false) => apiCall(`/fees/dues-exceptions${includeInactive ? '?includeInactive=true' : ''}`);
const createDuesException = (payload) => apiCall('/fees/dues-exceptions', { method: 'POST', body: payload });
const revokeDuesException = (id) => apiCall(`/fees/dues-exceptions/${id}/revoke`, { method: 'POST' });

const sendReminders = (assignmentIds, sms = false) => apiCall('/fees/reminders/send', { method: 'POST', body: { assignmentIds, sms } });
const runReminders = () => apiCall('/fees/reminders/run', { method: 'POST' });
const getReminderLog = () => apiCall('/fees/reminders/log');

// fee rules + automatic assignment
const getRuleOptions = () => apiCall('/fees/rule-options');
const previewStudentSync = (studentId) => apiCall(`/fees/students/${studentId}/fee-sync`);
const applyStudentSync = (studentId) => apiCall(`/fees/students/${studentId}/fee-sync`, { method: 'POST' });
const previewClassSync = (scope) => apiCall(`/fees/fee-sync/class?${new URLSearchParams(scope)}`);
const applyClassSync = (scope) => apiCall('/fees/fee-sync/class', { method: 'POST', body: scope });
const previewLeaving = (studentId, mode) => apiCall(`/fees/students/${studentId}/leaving-settlement${mode ? `?mode=${mode}` : ''}`);
const applyLeaving = (studentId, payload) => apiCall(`/fees/students/${studentId}/leaving-settlement`, { method: 'POST', body: payload });

const feePolicyService = {
  getPolicy, savePolicy, setStructurePolicy,
  getStudentStatus, useCredit, refundCredit, transferCredit, getCredits,
  getHolds, getExemptions, createExemption, revokeExemption,
  getDuesExceptions, createDuesException, revokeDuesException,
  sendReminders, runReminders, getReminderLog,
  getRuleOptions, previewStudentSync, applyStudentSync, previewClassSync, applyClassSync, previewLeaving, applyLeaving,
};
export default feePolicyService;
