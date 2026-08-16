/**
 * Institute Admin API Routes Definition
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const setupController = require('../controllers/setupController');
const studentController = require('../controllers/studentController');
const feeController = require('../controllers/feeController');
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

// Setup Routes
router.get('/setup/departments', setupController.getDepartments);
router.post('/setup/departments', setupController.createDepartment);
router.get('/setup/courses', setupController.getCourses);
router.post('/setup/courses', setupController.createCourse);

// Student Routes
router.get('/students', studentController.getStudents);
router.post('/students/admission', studentController.createStudentAdmission);

// Fee Routes
router.get('/fees/structures', feeController.getFeeStructures);
router.post('/fees/structures', feeController.createFeeStructure);
router.post('/fees/collect', feeController.collectOfflineFee);

module.exports = router;
