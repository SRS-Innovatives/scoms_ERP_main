/**
 * Staff API Routes Definition
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
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
const researchController = require('../controllers/researchController');
const galleryController = require('../controllers/galleryController');
const academicCalendarController = require('../controllers/academicCalendarController');
const {
  requireAuth, requireTenant, requireModule, handleForgotPassword, handleVerifyOtp, handleResetPassword,
  loginLimiter, otpLimiter,
  handleGetNotifications, handleGetUnreadCount, handleMarkNotificationRead, handleMarkAllNotificationsRead,
  shadowPermission, PERMISSIONS,
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

router.get('/auth/me', authController.getMe);
router.post('/auth/change-password', authController.changePassword);
router.patch('/auth/profile', authController.updateProfile);

// Notification Center
router.get('/notifications', handleGetNotifications);
router.get('/notifications/unread-count', handleGetUnreadCount);
router.patch('/notifications/:id/read', handleMarkNotificationRead);
router.patch('/notifications/read-all', handleMarkAllNotificationsRead);

// Profile (self-service)
router.get('/profile/me', profileController.getMyProfile);
router.patch('/profile/me', profileController.updateMyProfile);
router.post('/profile/qualifications', profileController.addMyQualification);
router.post('/profile/experience', profileController.addMyExperience);

// Leave (self-service)
router.get('/leave/types', profileController.getLeaveTypes);
router.get('/leave', profileController.getMyLeaves);
router.post('/leave', shadowPermission(PERMISSIONS.LEAVE_APPLY), profileController.applyMyLeave);

// Attendance Routes
router.use('/attendance', requireModule('attendance'));
router.get('/attendance/self', profileController.getMyAttendance);
router.get('/attendance/sms-status', shadowPermission(PERMISSIONS.ATTENDANCE_VIEW), attendanceController.getSmsStatus);
router.get('/attendance/my-classes', shadowPermission(PERMISSIONS.ATTENDANCE_VIEW), attendanceController.getMyClasses);
router.get('/attendance/roster', shadowPermission(PERMISSIONS.ATTENDANCE_VIEW), attendanceController.getRoster);
router.get('/attendance/session', shadowPermission(PERMISSIONS.ATTENDANCE_VIEW), attendanceController.getSession);
router.get('/attendance/history', shadowPermission(PERMISSIONS.ATTENDANCE_VIEW), attendanceController.getHistory);
router.get('/attendance/monthly-grid', shadowPermission(PERMISSIONS.ATTENDANCE_VIEW), attendanceController.getMonthlyGrid);
router.post('/attendance/mark', shadowPermission(PERMISSIONS.ATTENDANCE_MARK), attendanceController.markAttendance);
router.patch('/attendance/:sessionId', shadowPermission(PERMISSIONS.ATTENDANCE_UPDATE), attendanceController.updateAttendance);

// Assignment / Homework Routes
router.use('/assignments', requireModule('homework'));
router.get('/assignments/my-classes', shadowPermission(PERMISSIONS.ASSIGNMENTS_VIEW), assignmentController.getMyClasses);
router.get('/assignments', shadowPermission(PERMISSIONS.ASSIGNMENTS_VIEW), assignmentController.getAssignments);
router.post('/assignments', shadowPermission(PERMISSIONS.ASSIGNMENTS_CREATE), assignmentController.createAssignment);
router.get('/assignments/:id', shadowPermission(PERMISSIONS.ASSIGNMENTS_VIEW), assignmentController.getAssignmentById);
router.get('/assignments/:id/submissions', shadowPermission(PERMISSIONS.ASSIGNMENTS_VIEW), assignmentController.getSubmissions);
router.patch('/assignments/submissions/:submissionId/evaluate', shadowPermission(PERMISSIONS.ASSIGNMENTS_GRADE), assignmentController.evaluateSubmission);

// Question Bank & Paper Generator Routes
router.use('/questions', requireModule('examination'));
router.get('/questions', shadowPermission(PERMISSIONS.QUESTIONS_VIEW), examController.getQuestions);
router.get('/questions/my-subjects', shadowPermission(PERMISSIONS.QUESTIONS_VIEW), examController.getMySubjects);
router.post('/questions', shadowPermission(PERMISSIONS.QUESTIONS_CREATE), examController.createQuestion);
router.post('/questions/generate-paper', shadowPermission(PERMISSIONS.QUESTIONS_GENERATE_PAPER), examController.generateQuestionPaper);

// Exam Duties & Marks Entry
router.use('/exams', requireModule('examination'));
router.use('/exam-schedules', requireModule('examination'));
router.get('/exams/my-schedules', shadowPermission(PERMISSIONS.EXAMS_VIEW), examController.getMySchedules);
router.get('/exams/subject-performance', shadowPermission(PERMISSIONS.EXAMS_VIEW), examController.getSubjectPerformance);
router.get('/exams/student-performance', shadowPermission(PERMISSIONS.EXAMS_VIEW), examController.getStudentPerformanceSummary);
router.get('/exam-schedules/:scheduleId/roster', shadowPermission(PERMISSIONS.EXAMS_VIEW), examController.getRoster);
router.post('/exam-schedules/:scheduleId/marks', shadowPermission(PERMISSIONS.MARKS_ENTER), examController.saveMarks);
router.post('/exam-schedules/:scheduleId/publish', shadowPermission(PERMISSIONS.RESULTS_PUBLISH), examController.publishMarks);
router.post('/exam-schedules/:scheduleId/import', upload.single('file'), shadowPermission(PERMISSIONS.MARKS_ENTER), examController.parseMarksImport);

// Announcements
router.use('/announcements', requireModule('communication'));
router.get('/announcements', announcementController.getAnnouncements);
router.post('/announcements', shadowPermission(PERMISSIONS.ANNOUNCEMENTS_CREATE), announcementController.createAnnouncement);

// Timetable
router.use('/timetable', requireModule('timetable'));
router.get('/timetable/my', shadowPermission(PERMISSIONS.TIMETABLE_VIEW), timetableController.getMyTimetable);

// Library Desk
router.use('/library', requireModule('library'));
router.get('/library/students', shadowPermission(PERMISSIONS.LIBRARY_MANAGE), libraryController.searchStudents);
router.get('/library/books', shadowPermission(PERMISSIONS.LIBRARY_MANAGE), libraryController.searchBooks);
router.post('/library/issue', shadowPermission(PERMISSIONS.LIBRARY_MANAGE), libraryController.issueBook);
router.get('/library/issues', shadowPermission(PERMISSIONS.LIBRARY_MANAGE), libraryController.getActiveIssues);
router.post('/library/return', shadowPermission(PERMISSIONS.LIBRARY_MANAGE), libraryController.returnBook);
router.get('/library/fines', shadowPermission(PERMISSIONS.LIBRARY_MANAGE), libraryController.getFines);
router.patch('/library/fines/:id/collect', shadowPermission(PERMISSIONS.LIBRARY_MANAGE), libraryController.collectFine);

// Campus Events (read-only calendar view)
router.use('/events', requireModule('events_clubs'));
router.get('/events', eventController.getEvents);
router.get('/events/:eventId/registrations', eventController.getEventRegistrations);
router.post('/events/:eventId/attendance', shadowPermission(PERMISSIONS.EVENTS_MANAGE), eventController.markEventAttendance);

// Lab Equipment & Asset Register
router.use('/lab', requireModule('inventory'));
router.get('/lab/assets', shadowPermission(PERMISSIONS.LAB_MANAGE), labController.getLabAssets);
router.post('/lab/assets', shadowPermission(PERMISSIONS.LAB_MANAGE), labController.createLabAsset);
router.get('/lab/issues', shadowPermission(PERMISSIONS.LAB_MANAGE), labController.getIssuedEquipment);
router.post('/lab/issue', shadowPermission(PERMISSIONS.LAB_MANAGE), labController.issueEquipment);
router.patch('/lab/issues/:issueId/return', shadowPermission(PERMISSIONS.LAB_MANAGE), labController.returnEquipment);

// Appointment Requests
router.use('/appointments', requireModule('counselling'));
router.get('/appointments', shadowPermission(PERMISSIONS.APPOINTMENTS_MANAGE), appointmentController.getMyAppointments);
router.patch('/appointments/:id', shadowPermission(PERMISSIONS.APPOINTMENTS_MANAGE), appointmentController.updateAppointmentStatus);

// Parent-Teacher Meeting Notes
router.use('/parent-meetings', requireModule('ptm'));
router.get('/parent-meetings', shadowPermission(PERMISSIONS.PTM_MANAGE), parentMeetingController.getMyNotes);
router.post('/parent-meetings', shadowPermission(PERMISSIONS.PTM_MANAGE), parentMeetingController.createNote);

// SMS Broadcast Center & History
router.post('/sms/broadcast', shadowPermission(PERMISSIONS.NOTIFICATIONS_SEND), smsController.broadcastToSection);
router.post('/sms/send-to-parent', shadowPermission(PERMISSIONS.NOTIFICATIONS_SEND), smsController.sendToParent);
router.get('/sms/history', smsController.getMyHistory);
router.get('/sms/parent-contacts', smsController.getParentContacts);

// Student Achievements / Event Certificate Entry
router.use('/achievements', requireModule('career_portfolio'));
router.get('/achievements', shadowPermission(PERMISSIONS.ACHIEVEMENTS_MANAGE), achievementController.getAchievements);
router.post('/achievements', shadowPermission(PERMISSIONS.ACHIEVEMENTS_MANAGE), achievementController.createAchievement);

// Clubs & Societies (read-only view)
router.use('/clubs', requireModule('events_clubs'));
router.get('/clubs', clubController.getClubs);

// Study Materials
router.get('/materials/my-subjects', materialController.getMySubjects);
router.get('/materials', shadowPermission(PERMISSIONS.MATERIALS_VIEW), materialController.getMaterials);
router.post('/materials', shadowPermission(PERMISSIONS.MATERIALS_UPLOAD), materialController.createMaterial);
router.delete('/materials/:id', shadowPermission(PERMISSIONS.MATERIALS_UPLOAD), materialController.deleteMaterial);

// Student Leave Approval (for sections this staff member teaches)
router.get('/student-leave', shadowPermission(PERMISSIONS.LEAVE_APPROVE), studentLeaveController.getStudentLeaves);
router.patch('/student-leave/:id', shadowPermission(PERMISSIONS.LEAVE_APPROVE), studentLeaveController.updateStudentLeaveStatus);

// Messages
router.use('/messages', requireModule('messaging'));
router.get('/messages/students', shadowPermission(PERMISSIONS.MESSAGING_ACCESS), messageController.getMyStudents);
router.get('/messages/conversation', shadowPermission(PERMISSIONS.MESSAGING_ACCESS), messageController.getConversation);
router.post('/messages', shadowPermission(PERMISSIONS.MESSAGING_ACCESS), messageController.sendMessage);

// Research & Publications
router.use('/research', requireModule('research'));
router.get('/research', shadowPermission(PERMISSIONS.RESEARCH_MANAGE), researchController.getMyPublications);
router.post('/research', shadowPermission(PERMISSIONS.RESEARCH_MANAGE), researchController.createPublication);
router.patch('/research/:id', shadowPermission(PERMISSIONS.RESEARCH_MANAGE), researchController.updatePublication);
router.delete('/research/:id', shadowPermission(PERMISSIONS.RESEARCH_MANAGE), researchController.deletePublication);

// Photo Gallery
router.use('/gallery', requireModule('gallery'));
router.get('/gallery/albums', shadowPermission(PERMISSIONS.GALLERY_MANAGE), galleryController.getAlbums);
router.get('/gallery/albums/:id/photos', shadowPermission(PERMISSIONS.GALLERY_MANAGE), galleryController.getAlbumPhotos);
router.post('/gallery/albums/:id/photos', shadowPermission(PERMISSIONS.GALLERY_MANAGE), galleryController.addPhoto);

// Academic Calendar (read-only)
router.get('/academic-calendar', requireModule('academic_calendar'), academicCalendarController.getEvents);

module.exports = router;
