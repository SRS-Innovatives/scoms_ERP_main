/**
 * Staff API Routes Definition
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const attendanceController = require('../controllers/attendanceController');
const assignmentController = require('../controllers/assignmentController');
const examController = require('../controllers/examController');
const announcementController = require('../controllers/announcementController');
const timetableController = require('../controllers/timetableController');
const profileController = require('../controllers/profileController');
const libraryController = require('../controllers/libraryController');
const eventController = require('../controllers/eventController');
const clubController = require('../controllers/clubController');
const materialController = require('../controllers/materialController');
const studentLeaveController = require('../controllers/studentLeaveController');
const messageController = require('../controllers/messageController');
const labController = require('../controllers/labController');
const appointmentController = require('../controllers/appointmentController');
const parentMeetingController = require('../controllers/parentMeetingController');
const smsController = require('../controllers/smsController');
const achievementController = require('../controllers/achievementController');
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

// Profile (self-service)
router.get('/profile/me', profileController.getMyProfile);
router.patch('/profile/me', profileController.updateMyProfile);
router.post('/profile/qualifications', profileController.addMyQualification);
router.post('/profile/experience', profileController.addMyExperience);

// Leave (self-service)
router.get('/leave', profileController.getMyLeaves);
router.post('/leave', profileController.applyMyLeave);

// Attendance Routes
router.use('/attendance', requireModule('attendance'));
router.get('/attendance/self', profileController.getMyAttendance);
router.get('/attendance/my-classes', attendanceController.getMyClasses);
router.get('/attendance/roster', attendanceController.getRoster);
router.get('/attendance/session', attendanceController.getSession);
router.get('/attendance/history', attendanceController.getHistory);
router.get('/attendance/monthly-grid', attendanceController.getMonthlyGrid);
router.post('/attendance/mark', attendanceController.markAttendance);
router.patch('/attendance/:sessionId', attendanceController.updateAttendance);

// Assignment Routes
router.get('/assignments/my-classes', assignmentController.getMyClasses);
router.get('/assignments', assignmentController.getAssignments);
router.post('/assignments', assignmentController.createAssignment);
router.get('/assignments/:id', assignmentController.getAssignmentById);
router.get('/assignments/:id/submissions', assignmentController.getSubmissions);
router.patch('/assignments/submissions/:submissionId/evaluate', assignmentController.evaluateSubmission);

// Question Bank & Paper Generator Routes
router.use('/questions', requireModule('examination'));
router.get('/questions', examController.getQuestions);
router.get('/questions/my-subjects', examController.getMySubjects);
router.post('/questions', examController.createQuestion);
router.post('/questions/generate-paper', examController.generateQuestionPaper);

// Exam Duties & Marks Entry
router.use('/exams', requireModule('examination'));
router.use('/exam-schedules', requireModule('examination'));
router.get('/exams/my-schedules', examController.getMySchedules);
router.get('/exams/subject-performance', examController.getSubjectPerformance);
router.get('/exams/student-performance', examController.getStudentPerformanceSummary);
router.get('/exam-schedules/:scheduleId/roster', examController.getRoster);
router.post('/exam-schedules/:scheduleId/marks', examController.saveMarks);
router.post('/exam-schedules/:scheduleId/publish', examController.publishMarks);

// Announcements
router.use('/announcements', requireModule('communication'));
router.get('/announcements', announcementController.getAnnouncements);
router.post('/announcements', announcementController.createAnnouncement);

// Timetable
router.use('/timetable', requireModule('timetable'));
router.get('/timetable/my', timetableController.getMyTimetable);

// Library Desk
router.use('/library', requireModule('library'));
router.get('/library/students', libraryController.searchStudents);
router.get('/library/books', libraryController.searchBooks);
router.post('/library/issue', libraryController.issueBook);
router.get('/library/issues', libraryController.getActiveIssues);
router.post('/library/return', libraryController.returnBook);
router.get('/library/fines', libraryController.getFines);
router.patch('/library/fines/:id/collect', libraryController.collectFine);

// Campus Events (read-only calendar view)
router.get('/events', eventController.getEvents);
router.get('/events/:eventId/registrations', eventController.getEventRegistrations);
router.post('/events/:eventId/attendance', eventController.markEventAttendance);

// Lab Equipment & Asset Register
router.use('/lab', requireModule('inventory'));
router.get('/lab/assets', labController.getLabAssets);
router.post('/lab/assets', labController.createLabAsset);
router.get('/lab/issues', labController.getIssuedEquipment);
router.post('/lab/issue', labController.issueEquipment);
router.patch('/lab/issues/:issueId/return', labController.returnEquipment);

// Appointment Requests
router.get('/appointments', appointmentController.getMyAppointments);
router.patch('/appointments/:id', appointmentController.updateAppointmentStatus);

// Parent-Teacher Meeting Notes
router.get('/parent-meetings', parentMeetingController.getMyNotes);
router.post('/parent-meetings', parentMeetingController.createNote);

// SMS Broadcast Center & History
router.post('/sms/broadcast', smsController.broadcastToSection);
router.post('/sms/send-to-parent', smsController.sendToParent);
router.get('/sms/history', smsController.getMyHistory);
router.get('/sms/parent-contacts', smsController.getParentContacts);

// Student Achievements / Event Certificate Entry
router.get('/achievements', achievementController.getAchievements);
router.post('/achievements', achievementController.createAchievement);

// Clubs & Societies (read-only view)
router.get('/clubs', clubController.getClubs);

// Study Materials
router.get('/materials/my-subjects', materialController.getMySubjects);
router.get('/materials', materialController.getMaterials);
router.post('/materials', materialController.createMaterial);
router.delete('/materials/:id', materialController.deleteMaterial);

// Student Leave Approval (for sections this staff member teaches)
router.get('/student-leave', studentLeaveController.getStudentLeaves);
router.patch('/student-leave/:id', studentLeaveController.updateStudentLeaveStatus);

// Messages
router.get('/messages/students', messageController.getMyStudents);
router.get('/messages/conversation', messageController.getConversation);
router.post('/messages', messageController.sendMessage);

module.exports = router;
