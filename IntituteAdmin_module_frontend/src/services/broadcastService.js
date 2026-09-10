// Bulk SMS & Email Broadcast Service — /api/v1/admin/broadcast/*
import apiCall from './api';

const broadcastSms = (payload) => apiCall('/broadcast/sms', { method: 'POST', body: payload });
const getSmsLogs = () => apiCall('/broadcast/sms/logs');
const broadcastEmail = (payload) => apiCall('/broadcast/email', { method: 'POST', body: payload });
const getEmailLogs = () => apiCall('/broadcast/email/logs');
const broadcastWhatsapp = (payload) => apiCall('/broadcast/whatsapp', { method: 'POST', body: payload });
const getWhatsappLogs = () => apiCall('/broadcast/whatsapp/logs');

export const broadcastService = { broadcastSms, getSmsLogs, broadcastEmail, getEmailLogs, broadcastWhatsapp, getWhatsappLogs };
export default broadcastService;
