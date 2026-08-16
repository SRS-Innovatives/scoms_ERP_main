/**
 * Student API Routes Definition
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const studentProfileController = require('../controllers/studentProfileController');
const feePaymentController = require('../controllers/feePaymentController');
const aiAssistantController = require('../controllers/aiAssistantController');
const { requireAuth, requireTenant } = require('../../../shared');

// Standalone Auth Routes
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', authController.logout);

// Guarded Tenant Routes
router.use(requireAuth);
router.use(requireTenant);

router.get('/auth/me', authController.getMe);
router.post('/auth/change-password', authController.changePassword);

// Profile & Attendance Routes
router.get('/profile', studentProfileController.getProfile);
router.get('/attendance', studentProfileController.getAttendanceSummary);

// Fee & Payment Routes
router.get('/fees', feePaymentController.getFeesOverview);
router.post('/fees/pay/initiate', feePaymentController.initiateOnlinePayment);
router.post('/fees/pay/verify', feePaymentController.verifyOnlinePayment);

// AI Assistant Routes
router.post('/ai/ask', aiAssistantController.askAiAssistant);

module.exports = router;
