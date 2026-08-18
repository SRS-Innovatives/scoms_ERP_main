/**
 * Super Admin API Routes Definition
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const institutionController = require('../controllers/institutionController');
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

module.exports = router;
