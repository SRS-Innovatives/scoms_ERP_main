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
const knowledgeBaseController = require('../controllers/knowledgeBaseController');
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
const admissionFieldReviewController = require('../controllers/admissionFieldReviewController');
const moduleRegistryController = require('../controllers/moduleRegistryController');
const {
  requireAuth, requireRole, ROLES, PERMISSIONS, handleForgotPassword, handleVerifyOtp, handleResetPassword,
  loginLimiter, otpLimiter,
  handleGetNotifications, handleGetUnreadCount, handleMarkNotificationRead, handleMarkAllNotificationsRead,
} = require('../../../shared');
const shadowPermission = require('../../../shared/middleware/shadowPermission');

// Standalone Auth Routes
router.post('/auth/login', loginLimiter, authController.login);
router.post('/auth/forgot-password', otpLimiter, handleForgotPassword);
router.post('/auth/verify-otp', otpLimiter, handleVerifyOtp);
router.post('/auth/reset-password', otpLimiter, handleResetPassword);
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
router.post('/reports', shadowPermission(PERMISSIONS.REPORTS_MANAGE), reportManagementController.createReport);
router.get('/reports/:id', reportManagementController.getReportById);
router.patch('/reports/:id', shadowPermission(PERMISSIONS.REPORTS_MANAGE), reportManagementController.updateReport);
router.delete('/reports/:id', shadowPermission(PERMISSIONS.REPORTS_MANAGE), reportManagementController.archiveReport);
router.post('/reports/:id/clone', shadowPermission(PERMISSIONS.REPORTS_MANAGE), reportManagementController.cloneReport);

// Dynamic Report Engine — Institution Assignment
router.get('/institutions/:id/reports', reportManagementController.getInstitutionReports);
router.post('/institutions/:id/reports', shadowPermission(PERMISSIONS.REPORTS_MANAGE), reportManagementController.assignReportsToInstitution);
router.patch('/institutions/:id/reports/:reportId', shadowPermission(PERMISSIONS.REPORTS_MANAGE), reportManagementController.updateInstitutionReport);

// Dynamic Report Engine — Custom Report Requests (review workflow)
router.get('/report-requests', reportManagementController.getReportRequests);
router.patch('/report-requests/:id', shadowPermission(PERMISSIONS.REPORTS_MANAGE), reportManagementController.updateReportRequest);

// Institutions Management
router.get('/institutions', institutionController.getInstitutions);
router.post('/institutions', shadowPermission(PERMISSIONS.INSTITUTIONS_CREATE), institutionController.createInstitutionOnboarding);
router.get('/institutions/modules-catalog', institutionController.getModuleCatalog);
router.post('/institutions/:institutionId/admin', shadowPermission(PERMISSIONS.INSTITUTIONS_CREATE), institutionController.createInstituteAdmin);
router.get('/institutions/:id', institutionController.getInstitutionById);
router.patch('/institutions/:id/status', shadowPermission(PERMISSIONS.INSTITUTIONS_UPDATE), institutionController.updateInstitutionStatus);
router.patch('/institutions/:id/modules', shadowPermission(PERMISSIONS.INSTITUTIONS_MANAGE_MODULES), institutionController.updateInstitutionModules);

// Admission Custom Field Approvals
router.get('/admission-fields/pending', admissionFieldReviewController.getPendingFields);
router.get('/admission-fields/institution/:institutionId', admissionFieldReviewController.getFieldsForInstitution);
router.post('/admission-fields/:id/approve', shadowPermission(PERMISSIONS.ADMISSION_FIELDS_REVIEW), admissionFieldReviewController.approveField);
router.post('/admission-fields/:id/reject', shadowPermission(PERMISSIONS.ADMISSION_FIELDS_REVIEW), admissionFieldReviewController.rejectField);
router.post('/admission-fields/bulk-review', shadowPermission(PERMISSIONS.ADMISSION_FIELDS_REVIEW), admissionFieldReviewController.bulkReview);
router.put('/institutions/:id', shadowPermission(PERMISSIONS.INSTITUTIONS_UPDATE), institutionController.updateInstitution);
router.delete('/institutions/:id', shadowPermission(PERMISSIONS.INSTITUTIONS_DELETE), institutionController.deleteInstitution);
router.get('/audit-logs', institutionController.getAuditLogs);

// Users
router.get('/users', userController.getUsers);
router.get('/roles', userController.getRoles);
router.get('/roles/:role/permissions', userController.getRolePermissions);
router.put('/roles/:role/permissions', shadowPermission(PERMISSIONS.USERS_MANAGE_ROLES), userController.updateRolePermissions);

// Billing & GST
router.get('/invoices', billingController.getInvoices);
router.post('/invoices', shadowPermission(PERMISSIONS.BILLING_MANAGE), billingController.generateInvoice);
router.get('/invoices/:id', billingController.getInvoiceById);
router.patch('/invoices/:id/status', shadowPermission(PERMISSIONS.BILLING_MANAGE), billingController.updateInvoiceStatus);
router.get('/billing-stats', billingController.getBillingStats);
router.get('/billing/gst-profile', billingController.getGstProfile);
router.put('/billing/gst-profile', shadowPermission(PERMISSIONS.BILLING_MANAGE), billingController.updateGstProfile);

// Subscriptions
router.get('/plans', subscriptionController.getPlans);
router.post('/plans', shadowPermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE), subscriptionController.createPlan);
router.patch('/plans/:id', shadowPermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE), subscriptionController.updatePlan);
router.get('/subscriptions', subscriptionController.getSubscriptions);
router.get('/subscriptions/renewals', subscriptionController.getRenewals);
router.post('/subscriptions/:id/remind', shadowPermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE), subscriptionController.sendRenewalReminder);

// Support
router.get('/tickets', supportController.getTickets);
router.post('/tickets', shadowPermission(PERMISSIONS.SUPPORT_MANAGE), supportController.createTicket);
router.patch('/tickets/:id', shadowPermission(PERMISSIONS.SUPPORT_MANAGE), supportController.updateTicket);

router.get('/knowledge-base', knowledgeBaseController.getArticles);
router.post('/knowledge-base', shadowPermission(PERMISSIONS.KNOWLEDGE_BASE_MANAGE), knowledgeBaseController.createArticle);
router.patch('/knowledge-base/:id', shadowPermission(PERMISSIONS.KNOWLEDGE_BASE_MANAGE), knowledgeBaseController.updateArticle);
router.delete('/knowledge-base/:id', shadowPermission(PERMISSIONS.KNOWLEDGE_BASE_MANAGE), knowledgeBaseController.deleteArticle);

// AI Usage
router.get('/ai-usage', aiController.getAiUsage);
router.get('/ai-config', aiController.getAiConfig);
router.patch('/ai-config', shadowPermission(PERMISSIONS.AI_CONFIG_MANAGE), aiController.updateAiConfig);

// Analytics
router.get('/analytics', analyticsController.getAnalytics);

// Settings
router.get('/settings', settingsController.getSettings);
router.put('/settings', shadowPermission(PERMISSIONS.PLATFORM_SETTINGS_MANAGE), settingsController.updateSettings);

// Security Center
router.get('/security/overview', securityController.getSecurityOverview);

// System & Health
router.get('/system/health', systemController.getSystemHealth);

// Integration Hub (Phase 12)
router.get('/integrations/providers', systemController.getIntegrationProviders);
router.post('/integrations/providers', shadowPermission(PERMISSIONS.INTEGRATIONS_MANAGE), systemController.registerProvider);
router.patch('/integrations/providers/:id', shadowPermission(PERMISSIONS.INTEGRATIONS_MANAGE), systemController.updateProvider);

// SMS Stats & Credit Wallet
router.get('/sms-stats', smsController.getSmsStats);
router.get('/sms/wallet', smsController.getWalletOverview);
router.post('/sms/purchase', shadowPermission(PERMISSIONS.SMS_MANAGE), smsController.purchaseSmsCredits);
router.post('/sms/allocate', shadowPermission(PERMISSIONS.SMS_MANAGE), smsController.allocateSmsCredits);

// Email Stats & Credit Wallet
router.get('/email-stats', emailController.getEmailStats);
router.get('/email/logs', emailController.getRecentEmailLogs);
router.get('/email/wallet', emailController.getWalletOverview);
router.post('/email/purchase', shadowPermission(PERMISSIONS.EMAIL_MANAGE), emailController.purchaseEmailCredits);
router.post('/email/allocate', shadowPermission(PERMISSIONS.EMAIL_MANAGE), emailController.allocateEmailCredits);

// WhatsApp Stats & Credit Wallet
router.get('/whatsapp-stats', whatsappController.getWhatsappStats);
router.get('/whatsapp/wallet', whatsappController.getWalletOverview);
router.post('/whatsapp/purchase', shadowPermission(PERMISSIONS.WHATSAPP_MANAGE), whatsappController.purchaseWhatsappCredits);
router.post('/whatsapp/allocate', shadowPermission(PERMISSIONS.WHATSAPP_MANAGE), whatsappController.allocateWhatsappCredits);

// Announcements
router.get('/announcements', announcementController.getAnnouncements);
router.post('/announcements', shadowPermission(PERMISSIONS.ANNOUNCEMENTS_CREATE), announcementController.createAnnouncement);
router.delete('/announcements/:id', shadowPermission(PERMISSIONS.ANNOUNCEMENTS_CREATE), announcementController.deleteAnnouncement);

// Module Registry (Phase 2) — separate from the legacy /institutions/:id/modules toggle
// above, which keeps working untouched. See shared/moduleRegistry/.
router.get('/module-registry', moduleRegistryController.getModules);
router.post('/module-registry', shadowPermission(PERMISSIONS.MODULE_REGISTRY_MANAGE), moduleRegistryController.createModule);
router.get('/module-registry/:id', moduleRegistryController.getModuleById);
router.patch('/module-registry/:id', shadowPermission(PERMISSIONS.MODULE_REGISTRY_MANAGE), moduleRegistryController.updateModule);
router.patch('/module-registry/:id/status', shadowPermission(PERMISSIONS.MODULE_REGISTRY_MANAGE), moduleRegistryController.updateModuleStatus);
router.post('/module-registry/:id/versions', shadowPermission(PERMISSIONS.MODULE_REGISTRY_MANAGE), moduleRegistryController.createModuleVersion);
router.post('/module-registry/:id/dependencies', shadowPermission(PERMISSIONS.MODULE_REGISTRY_MANAGE), moduleRegistryController.addModuleDependency);
router.delete('/module-registry/dependencies/:dependencyId', shadowPermission(PERMISSIONS.MODULE_REGISTRY_MANAGE), moduleRegistryController.removeModuleDependency);
router.get('/module-registry/:id/assignable-institutions', moduleRegistryController.getAssignableInstitutions);
router.get('/module-registry/:id/manifest', moduleRegistryController.getManifest);
router.post('/module-registry/:id/assignments', shadowPermission(PERMISSIONS.MODULE_REGISTRY_MANAGE), moduleRegistryController.assignModuleToInstitution);
router.patch('/module-registry/assignments/:assignmentId', shadowPermission(PERMISSIONS.MODULE_REGISTRY_MANAGE), moduleRegistryController.updateModuleAssignment);
router.delete('/module-registry/assignments/:assignmentId', shadowPermission(PERMISSIONS.MODULE_REGISTRY_MANAGE), moduleRegistryController.removeModuleAssignment);

module.exports = router;
