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
router.post('/institutions/:institutionId/admin', institutionController.createInstituteAdmin);
router.get('/institutions/:id', institutionController.getInstitutionById);
router.patch('/institutions/:id/status', institutionController.updateInstitutionStatus);
router.put('/institutions/:id', institutionController.updateInstitution);
router.delete('/institutions/:id', institutionController.deleteInstitution);
router.get('/audit-logs', institutionController.getAuditLogs);

// Users
router.get('/users', userController.getUsers);

// Billing
router.get('/invoices', billingController.getInvoices);
router.get('/billing-stats', billingController.getBillingStats);

// Subscriptions
router.get('/plans', subscriptionController.getPlans);
router.get('/subscriptions', subscriptionController.getSubscriptions);

// Support
router.get('/tickets', supportController.getTickets);

// AI Usage
router.get('/ai-usage', aiController.getAiUsage);

// Analytics
router.get('/analytics', analyticsController.getAnalytics);

// Settings
router.get('/settings', settingsController.getSettings);

// SMS Stats
router.get('/sms-stats', smsController.getSmsStats);

module.exports = router;
