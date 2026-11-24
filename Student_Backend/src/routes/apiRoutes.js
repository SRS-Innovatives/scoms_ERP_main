/**
 * Student API Routes Definition
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const studentProfileController = require('../controllers/studentProfileController');
const feePaymentController = require('../controllers/feePaymentController');
const attendanceCorrectionController = require('../controllers/attendanceCorrectionController');
const myDocumentsController = require('../controllers/myDocumentsController');
const notificationPrefsController = require('../controllers/notificationPrefsController');
const scholarshipController = require('../controllers/scholarshipController');
const aiAssistantController = require('../controllers/aiAssistantController');
const announcementController = require('../controllers/announcementController');
const circularController = require('../controllers/circularController');
const timetableController = require('../controllers/timetableController');
const examController = require('../controllers/examController');
const houseController = require('../controllers/houseController');
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
const galleryController = require('../controllers/galleryController');
const academicCalendarController = require('../controllers/academicCalendarController');
const parentController = require('../controllers/parentController');
const parentRecordsController = require('../controllers/parentRecordsController');
const dashboardSummaryController = require('../controllers/dashboardSummaryController');
const {
  requireAuth, requireTenant, requireModule, handleForgotPassword, handleVerifyOtp, handleResetPassword,
  loginLimiter, otpLimiter,
  handleGetNotifications, handleGetUnreadCount, handleMarkNotificationRead, handleMarkAllNotificationsRead,
  resolveActiveChild, blockParentWrite,
  shadowPermission, PERMISSIONS,
  requireRole, ROLES,
} = require('../../../shared');

// Standalone Auth Routes
router.post('/auth/login', loginLimiter, authController.login);
router.post('/auth/forgot-password', otpLimiter, handleForgotPassword);
router.post('/auth/verify-otp', otpLimiter, handleVerifyOtp);
router.post('/auth/reset-password', otpLimiter, handleResetPassword);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', authController.logout);

// Guarded Tenant Routes
router.use(requireAuth);
router.use(requireTenant);
// The Student API is for students and parents only. Without this a staff member's token
// (which has no studentId) could call student routes, where an empty "this student" filter
// is ignored by the database and could return other students' records.
router.use(requireRole(ROLES.STUDENT, ROLES.PARENT));
router.use(resolveActiveChild); // Parent JWTs carry no studentId (a parent can have >1 child) — this
// resolves & validates which real child is active for this request, then every existing
// studentId-scoped route below works for a Parent exactly as it already does for a Student.

router.get('/auth/me', authController.getMe);
router.post('/auth/change-password', authController.changePassword);
router.patch('/auth/profile', authController.updateProfile);

// Parent — which real children are linked to this account (for the child-switcher)
router.get('/parent/children', parentController.getMyChildren);
// Parent — their own account details (not the child's), view + edit contact fields
router.get('/parent/profile', parentController.getMyProfile);
router.patch('/parent/profile', parentController.updateMyProfile);

// Notification Center
router.get('/notifications', handleGetNotifications);
router.get('/notifications/unread-count', handleGetUnreadCount);
router.patch('/notifications/:id/read', handleMarkNotificationRead);
router.patch('/notifications/read-all', handleMarkAllNotificationsRead);

// Profile Route (core — always accessible)
router.get('/profile', studentProfileController.getProfile);
router.patch('/profile', studentProfileController.updateProfile);
router.get('/profile/id-card', studentProfileController.getIdCard);
router.get('/degrees', requireModule('convocation'), studentProfileController.getMyDegrees);
router.get('/subjects', studentProfileController.getMySubjects);

// SMS / WhatsApp preferences (Settings) — enforced in shared/utils/notificationPreferences.js
router.get('/settings/notifications', notificationPrefsController.getPrefs);
router.put('/settings/notifications', notificationPrefsController.updatePrefs);

// My Documents — what the institution keeps on my record (read-only)
router.get('/documents', myDocumentsController.getMyDocuments);

// Attendance
router.get('/attendance', requireModule('attendance'), shadowPermission(PERMISSIONS.ATTENDANCE_VIEW), studentProfileController.getAttendanceSummary);
// ask for a wrong mark to be fixed — decided under Attendance → Correction Approvals
router.get('/attendance/corrections', requireModule('attendance'), shadowPermission(PERMISSIONS.ATTENDANCE_VIEW), attendanceCorrectionController.getMyCorrections);
router.post('/attendance/corrections', requireModule('attendance'), blockParentWrite('Requesting an attendance correction'), shadowPermission(PERMISSIONS.ATTENDANCE_VIEW), attendanceCorrectionController.requestCorrection);

// Fee & Payment Routes
router.use('/fees', requireModule('fee'));
router.get('/fees', shadowPermission(PERMISSIONS.FEES_VIEW), feePaymentController.getFeesOverview);
router.get('/fees/status', shadowPermission(PERMISSIONS.FEES_VIEW), feePaymentController.getFeeStatus);
// "Fee Overview" menu badge: OVERDUE / DUE / PAID for this student
router.get('/fees/badge', shadowPermission(PERMISSIONS.FEES_VIEW), feePaymentController.getFeeBadge);
router.post('/fees/pay/initiate', shadowPermission(PERMISSIONS.PAYMENTS_ONLINE), feePaymentController.initiateOnlinePayment);
router.post('/fees/pay/verify', shadowPermission(PERMISSIONS.PAYMENTS_ONLINE), feePaymentController.verifyOnlinePayment);
// Scholarship / concession applications — go to the Institute Admin's approval queue
router.get('/fees/concession-schemes', shadowPermission(PERMISSIONS.FEES_VIEW), scholarshipController.getSchemes);
router.get('/fees/concessions', shadowPermission(PERMISSIONS.FEES_VIEW), scholarshipController.getMyApplications);
router.post('/fees/concessions', shadowPermission(PERMISSIONS.FEES_VIEW), scholarshipController.applyForConcession);

// AI Assistant Routes
router.use('/ai', requireModule('ai_tutor'));
router.post('/ai/ask', shadowPermission(PERMISSIONS.AI_ACCESS), aiAssistantController.askAiAssistant);
router.get('/ai/topics', shadowPermission(PERMISSIONS.AI_ACCESS), aiAssistantController.getAvailableTopics);

// Announcements
router.get('/announcements', requireModule('communication'), announcementController.getAnnouncements);
router.get('/circulars', requireModule('communication'), circularController.getCirculars);
router.get('/circulars/:id', requireModule('communication'), circularController.getCircular);

// Timetable
router.get('/timetable', requireModule('timetable'), shadowPermission(PERMISSIONS.TIMETABLE_VIEW), timetableController.getTimetable);

// Examination
router.use('/exams', requireModule('examination'));
router.get('/exams/schedule', shadowPermission(PERMISSIONS.EXAMS_VIEW), examController.getExamSchedule);
router.get('/exams/results', shadowPermission(PERMISSIONS.RESULTS_VIEW), examController.getResults);
router.get('/exams/:examId/hall-ticket', shadowPermission(PERMISSIONS.EXAMS_VIEW), examController.getHallTicket);
router.get('/exams/:examId/marksheet', shadowPermission(PERMISSIONS.RESULTS_VIEW), examController.getMarksheet);

// My House — the student's own house, its points and standing
router.get('/house', houseController.getMyHouse);

// Campus Services — Library, Transport, Hostel
router.get('/library', requireModule('library'), campusController.getMyLibrary);
router.post('/library/renew', requireModule('library'), campusController.renewBook);
router.get('/transport', requireModule('transport'), campusController.getMyTransport);
router.get('/hostel', requireModule('hostel'), campusController.getMyHostel);

// Assignments / Homework
router.use('/assignments', requireModule('homework'));
router.get('/assignments', shadowPermission(PERMISSIONS.ASSIGNMENTS_VIEW), assignmentController.getMyAssignments);
router.post('/assignments/submit', blockParentWrite('Submitting homework'), shadowPermission(PERMISSIONS.ASSIGNMENTS_SUBMIT), assignmentController.submitAssignment);

// Campus Events & Clubs
router.use('/events', requireModule('events_clubs'));
router.get('/events', eventController.getEvents);
router.post('/events/register', blockParentWrite('Registering for an event'), eventController.registerForEvent);

router.use('/clubs', requireModule('events_clubs'));
router.get('/clubs', clubController.getClubs);
router.post('/clubs/join', blockParentWrite('Joining a club'), clubController.joinClub);

// Grievances
router.use('/grievances', requireModule('grievance_feedback'));
router.get('/grievances', grievanceController.getMyGrievances);
router.post('/grievances', shadowPermission(PERMISSIONS.GRIEVANCES_SUBMIT), grievanceController.submitGrievance);

// Study Materials
router.get('/materials', shadowPermission(PERMISSIONS.MATERIALS_VIEW), materialController.getMaterials);
// the student opened a material → counted for the teacher's Download History
router.post('/materials/:id/opened', shadowPermission(PERMISSIONS.MATERIALS_VIEW), materialController.markOpened);

// Leave / Absence Requests
router.get('/leave/types', leaveController.getLeaveTypes);
router.get('/leave', leaveController.getMyLeaves);
router.post('/leave', shadowPermission(PERMISSIONS.LEAVE_APPLY), leaveController.applyLeave);

// Issued Certificates & Documents
router.get('/certificates', requireModule('certificates'), certificateController.getMyCertificates);
router.get('/certificate-requests', requireModule('certificates'), certificateController.getMyCertificateRequests);
router.get('/certificate-types', requireModule('certificates'), certificateController.getRequestableTypes);
router.post('/certificate-requests', requireModule('certificates'), certificateController.requestCertificate);

// Messages
router.use('/messages', requireModule('messaging'));
router.get('/messages/teachers', messageController.getMyTeachers);
router.get('/messages/conversation', messageController.getConversation);
router.post('/messages', messageController.sendMessage);

// Question Bank (practice material)
router.get('/question-bank', requireModule('examination'), questionBankController.getQuestions);

// Resume Builder & Achievements Portfolio
router.use('/resume', requireModule('career_portfolio'));
router.get('/resume', resumeController.getMyResume);
router.put('/resume', resumeController.updateMyResume);

router.use('/achievements', requireModule('career_portfolio'));
router.get('/achievements', achievementController.getMyAchievements);
router.post('/achievements', achievementController.addAchievement);

// Anonymous Course Feedback
router.get('/feedback/subjects', requireModule('grievance_feedback'), feedbackController.getFeedbackSubjects);
router.post('/feedback', requireModule('grievance_feedback'), blockParentWrite('Anonymous course feedback'), feedbackController.submitFeedback);

// Appointments / Counselling
router.use('/appointments', requireModule('counselling'));
router.get('/appointments/teachers', appointmentController.getMyTeachers);
router.get('/appointments', appointmentController.getMyAppointments);
router.post('/appointments', appointmentController.bookAppointment);

// Internships & Placements
router.use('/postings', requireModule('placement'));
router.get('/postings', jobPostingController.getPostings);
router.post('/postings/apply', blockParentWrite('Applying to a job/internship posting'), jobPostingController.applyToPosting);
router.get('/postings/my-applications', jobPostingController.getMyApplications);

// Photo Gallery (view-only)
router.use('/gallery', requireModule('gallery'));
router.get('/gallery/albums', galleryController.getAlbums);
router.get('/gallery/albums/:id/photos', galleryController.getAlbumPhotos);

// Academic Calendar (read-only)
router.get('/academic-calendar', requireModule('academic_calendar'), academicCalendarController.getEvents);

// Home screen in one request — counts/sums only (dashboardSummaryController)
router.get('/dashboard/summary', dashboardSummaryController.getDashboardSummary);

// Parent-only, read-only records about the active child (parentRecordsController)
router.get('/discipline', requireModule('discipline'), parentRecordsController.getDisciplineRecords);
router.get('/health-records', requireModule('health'), parentRecordsController.getHealthRecords);
router.get('/ptm-notes', requireModule('ptm'), parentRecordsController.getPtmNotes);

module.exports = router;
