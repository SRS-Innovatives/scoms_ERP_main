/**
 * Student API Routes Definition
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const studentProfileController = require('../controllers/studentProfileController');
const feePaymentController = require('../controllers/feePaymentController');
const aiAssistantController = require('../controllers/aiAssistantController');
const announcementController = require('../controllers/announcementController');
const timetableController = require('../controllers/timetableController');
const examController = require('../controllers/examController');
const campusController = require('../controllers/campusController');
const assignmentController = require('../controllers/assignmentController');
const eventController = require('../controllers/eventController');
const grievanceController = require('../controllers/grievanceController');
const clubController = require('../controllers/clubController');
const materialController = require('../controllers/materialController');
const leaveController = require('../controllers/leaveController');
const certificateController = require('../controllers/certificateController');
const messageController = require('../controllers/messageController');
const questionBankController = require('../controllers/questionBankController');
const resumeController = require('../controllers/resumeController');
const achievementController = require('../controllers/achievementController');
const feedbackController = require('../controllers/feedbackController');
const appointmentController = require('../controllers/appointmentController');
const jobPostingController = require('../controllers/jobPostingController');
const { requireAuth, requireTenant, requireModule, handleForgotPassword, handleVerifyOtp, handleResetPassword } = require('../../../shared');

// Standalone Auth Routes
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', handleForgotPassword);
router.post('/auth/verify-otp', handleVerifyOtp);
router.post('/auth/reset-password', handleResetPassword);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', authController.logout);

// Guarded Tenant Routes
router.use(requireAuth);
router.use(requireTenant);

router.get('/auth/me', authController.getMe);
router.post('/auth/change-password', authController.changePassword);
router.patch('/auth/profile', authController.updateProfile);

// Profile Route (core — always accessible)
router.get('/profile', studentProfileController.getProfile);
router.patch('/profile', studentProfileController.updateProfile);
router.get('/subjects', studentProfileController.getMySubjects);

// Attendance
router.get('/attendance', requireModule('attendance'), studentProfileController.getAttendanceSummary);

// Fee & Payment Routes
router.use('/fees', requireModule('fee'));
router.get('/fees', feePaymentController.getFeesOverview);
router.post('/fees/pay/initiate', feePaymentController.initiateOnlinePayment);
router.post('/fees/pay/verify', feePaymentController.verifyOnlinePayment);

// AI Assistant Routes
router.post('/ai/ask', aiAssistantController.askAiAssistant);

// Announcements
router.get('/announcements', requireModule('communication'), announcementController.getAnnouncements);

// Timetable
router.get('/timetable', requireModule('timetable'), timetableController.getTimetable);

// Examination
router.use('/exams', requireModule('examination'));
router.get('/exams/schedule', examController.getExamSchedule);
router.get('/exams/results', examController.getResults);

// Campus Services — Library, Transport, Hostel
router.get('/library', requireModule('library'), campusController.getMyLibrary);
router.post('/library/renew', requireModule('library'), campusController.renewBook);
router.get('/transport', requireModule('transport'), campusController.getMyTransport);
router.get('/hostel', requireModule('hostel'), campusController.getMyHostel);

// Assignments
router.get('/assignments', assignmentController.getMyAssignments);
router.post('/assignments/submit', assignmentController.submitAssignment);

// Campus Events
router.get('/events', eventController.getEvents);
router.post('/events/register', eventController.registerForEvent);

// Grievances
router.get('/grievances', grievanceController.getMyGrievances);
router.post('/grievances', grievanceController.submitGrievance);

// Clubs & Societies
router.get('/clubs', clubController.getClubs);
router.post('/clubs/join', clubController.joinClub);

// Study Materials
router.get('/materials', materialController.getMaterials);

// Leave / Absence Requests
router.get('/leave', leaveController.getMyLeaves);
router.post('/leave', leaveController.applyLeave);

// Issued Certificates & Documents
router.get('/certificates', requireModule('certificates'), certificateController.getMyCertificates);
router.get('/certificate-requests', requireModule('certificates'), certificateController.getMyCertificateRequests);
router.post('/certificate-requests', requireModule('certificates'), certificateController.requestCertificate);

// Messages
router.get('/messages/teachers', messageController.getMyTeachers);
router.get('/messages/conversation', messageController.getConversation);
router.post('/messages', messageController.sendMessage);

// Question Bank (practice material)
router.get('/question-bank', requireModule('examination'), questionBankController.getQuestions);

// Resume Builder
router.get('/resume', resumeController.getMyResume);
router.put('/resume', resumeController.updateMyResume);

// Achievements Portfolio
router.get('/achievements', achievementController.getMyAchievements);
router.post('/achievements', achievementController.addAchievement);

// Anonymous Course Feedback
router.get('/feedback/subjects', feedbackController.getFeedbackSubjects);
router.post('/feedback', feedbackController.submitFeedback);

// Appointments / Counselling
router.get('/appointments/teachers', appointmentController.getMyTeachers);
router.get('/appointments', appointmentController.getMyAppointments);
router.post('/appointments', appointmentController.bookAppointment);

// Internships & Placements
router.get('/postings', jobPostingController.getPostings);
router.post('/postings/apply', jobPostingController.applyToPosting);
router.get('/postings/my-applications', jobPostingController.getMyApplications);

module.exports = router;
