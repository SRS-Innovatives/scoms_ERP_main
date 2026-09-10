/**
 * Super Admin API Routes Definition
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const institutionController = require('../controllers/institutionController');
const userController = require('../controllers/userController');
const billingController = require('../controllers/billingController');
const subscriptionController = require('../controllers/subscriptionController');
const supportController = require('../controllers/supportController');
const aiController = require('../controllers/aiController');
const analyticsController = require('../controllers/analyticsController');
const settingsController = require('../controllers/settingsController');
const securityController = require('../controllers/securityController');
const systemController = require('../controllers/systemController');
const smsController = require('../controllers/smsController');
const emailController = require('../controllers/emailController');
const whatsappController = require('../controllers/whatsappController');
const announcementController = require('../controllers/announcementController');
const reportManagementController = require('../controllers/reportManagementController');
const {
  requireAuth, requireRole, ROLES, handleForgotPassword, handleVerifyOtp, handleResetPassword,
  handleGetNotifications, handleGetUnreadCount, handleMarkNotificationRead, handleMarkAllNotificationsRead,
} = require('../../../shared');

// Standalone Auth Routes
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', handleForgotPassword);
router.post('/auth/verify-otp', handleVerifyOtp);
router.post('/auth/reset-password', handleResetPassword);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', authController.logout);

// Guarded Routes
router.use(requireAuth);
router.use(requireRole(ROLES.SUPER_ADMIN, ROLES.PLATFORM_ADMIN));

router.get('/auth/me', authController.getMe);
router.post('/auth/change-password', authController.changePassword);
router.patch('/auth/profile', authController.updateProfile);

// Notification Center
router.get('/notifications', handleGetNotifications);
router.get('/notifications/unread-count', handleGetUnreadCount);
router.patch('/notifications/:id/read', handleMarkNotificationRead);
router.patch('/notifications/read-all', handleMarkAllNotificationsRead);

// Dynamic Report Engine — Catalog Management
router.get('/reports', reportManagementController.getReports);
router.post('/reports', reportManagementController.createReport);
router.get('/reports/:id', reportManagementController.getReportById);
router.patch('/reports/:id', reportManagementController.updateReport);
router.delete('/reports/:id', reportManagementController.archiveReport);
router.post('/reports/:id/clone', reportManagementController.cloneReport);

// Dynamic Report Engine — Institution Assignment
router.get('/institutions/:id/reports', reportManagementController.getInstitutionReports);
router.post('/institutions/:id/reports', reportManagementController.assignReportsToInstitution);
router.patch('/institutions/:id/reports/:reportId', reportManagementController.updateInstitutionReport);

// Dynamic Report Engine — Custom Report Requests (review workflow)
router.get('/report-requests', reportManagementController.getReportRequests);
router.patch('/report-requests/:id', reportManagementController.updateReportRequest);

// Institutions Management
router.get('/institutions', institutionController.getInstitutions);
router.post('/institutions', institutionController.createInstitutionOnboarding);
router.get('/institutions/modules-catalog', institutionController.getModuleCatalog);
router.post('/institutions/:institutionId/admin', institutionController.createInstituteAdmin);
router.get('/institutions/:id', institutionController.getInstitutionById);
router.patch('/institutions/:id/status', institutionController.updateInstitutionStatus);
router.patch('/institutions/:id/modules', institutionController.updateInstitutionModules);
router.put('/institutions/:id', institutionController.updateInstitution);
router.delete('/institutions/:id', institutionController.deleteInstitution);
router.get('/audit-logs', institutionController.getAuditLogs);

// Users
router.get('/users', userController.getUsers);
router.get('/roles', userController.getRoles);
router.get('/roles/:role/permissions', userController.getRolePermissions);
router.put('/roles/:role/permissions', userController.updateRolePermissions);

// Billing & GST
router.get('/invoices', billingController.getInvoices);
router.post('/invoices', billingController.generateInvoice);
router.get('/invoices/:id', billingController.getInvoiceById);
router.patch('/invoices/:id/status', billingController.updateInvoiceStatus);
router.get('/billing-stats', billingController.getBillingStats);
router.get('/billing/gst-profile', billingController.getGstProfile);
router.put('/billing/gst-profile', billingController.updateGstProfile);

// Subscriptions
router.get('/plans', subscriptionController.getPlans);
router.post('/plans', subscriptionController.createPlan);
router.patch('/plans/:id', subscriptionController.updatePlan);
router.get('/subscriptions', subscriptionController.getSubscriptions);
router.get('/subscriptions/renewals', subscriptionController.getRenewals);
router.post('/subscriptions/:id/remind', subscriptionController.sendRenewalReminder);

// Support
router.get('/tickets', supportController.getTickets);
router.post('/tickets', supportController.createTicket);
router.patch('/tickets/:id', supportController.updateTicket);

// AI Usage
router.get('/ai-usage', aiController.getAiUsage);

// Analytics
router.get('/analytics', analyticsController.getAnalytics);

// Settings
router.get('/settings', settingsController.getSettings);
router.put('/settings', settingsController.updateSettings);

// Security Center
router.get('/security/overview', securityController.getSecurityOverview);

// System & Health
router.get('/system/health', systemController.getSystemHealth);

// SMS Stats & Credit Wallet
router.get('/sms-stats', smsController.getSmsStats);
router.get('/sms/wallet', smsController.getWalletOverview);
router.post('/sms/purchase', smsController.purchaseSmsCredits);
router.post('/sms/allocate', smsController.allocateSmsCredits);

// Email Stats & Credit Wallet
router.get('/email-stats', emailController.getEmailStats);
router.get('/email/logs', emailController.getRecentEmailLogs);
router.get('/email/wallet', emailController.getWalletOverview);
router.post('/email/purchase', emailController.purchaseEmailCredits);
router.post('/email/allocate', emailController.allocateEmailCredits);

// WhatsApp Stats & Credit Wallet
router.get('/whatsapp-stats', whatsappController.getWhatsappStats);
router.get('/whatsapp/wallet', whatsappController.getWalletOverview);
router.post('/whatsapp/purchase', whatsappController.purchaseWhatsappCredits);
router.post('/whatsapp/allocate', whatsappController.allocateWhatsappCredits);

// Announcements
router.get('/announcements', announcementController.getAnnouncements);
router.post('/announcements', announcementController.createAnnouncement);
router.delete('/announcements/:id', announcementController.deleteAnnouncement);

module.exports = router;
