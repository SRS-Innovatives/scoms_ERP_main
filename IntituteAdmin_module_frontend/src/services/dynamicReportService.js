// Dynamic Report Builder Service — /api/v1/admin/reports/dynamic/*
import apiCall from './api';

const getDataSources = () => apiCall('/reports/dynamic/sources');
const preview = (body) => apiCall('/reports/dynamic/preview', { method: 'POST', body });
const exportReport = async (body) => {
  const res = await apiCall('/reports/dynamic/export', { method: 'POST', body, responseType: 'blob' });
  return res.blob;
};
const getSaved = () => apiCall('/reports/dynamic/saved');
const save = (body) => apiCall('/reports/dynamic/saved', { method: 'POST', body });
const runSaved = (id) => apiCall(`/reports/dynamic/saved/${id}/run`, { method: 'POST' });
const deleteSaved = (id) => apiCall(`/reports/dynamic/saved/${id}`, { method: 'DELETE' });

export const dynamicReportService = { getDataSources, preview, exportReport, getSaved, save, runSaved, deleteSaved };
export default dynamicReportService;
