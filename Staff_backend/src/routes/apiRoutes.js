/**
 * Staff API Routes Definition
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const attendanceController = require('../controllers/attendanceController');
const assignmentController = require('../controllers/assignmentController');
const examController = require('../controllers/examController');
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

// Attendance Routes
router.post('/attendance/mark', attendanceController.markAttendance);

// Assignment Routes
router.get('/assignments', assignmentController.getAssignments);
router.post('/assignments', assignmentController.createAssignment);
router.patch('/assignments/submissions/:submissionId/evaluate', assignmentController.evaluateSubmission);

// Question Bank & Paper Generator Routes
router.post('/questions', examController.createQuestion);
router.post('/questions/generate-paper', examController.generateQuestionPaper);

module.exports = router;
