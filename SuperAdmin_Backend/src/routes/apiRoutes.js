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
const smsController = require('../controllers/smsController');
const { requireAuth, requireRole, ROLES } = require('../../../shared');

// Standalone Auth Routes
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', authController.logout);

// Guarded Routes
router.use(requireAuth);
router.use(requireRole(ROLES.SUPER_ADMIN, ROLES.PLATFORM_ADMIN));

router.get('/auth/me', authController.getMe);
router.post('/auth/change-password', authController.changePassword);

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
router.get('/subscriptions', subscriptionController.getSubscriptions);

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

// SMS Stats
router.get('/sms-stats', smsController.getSmsStats);

module.exports = router;
