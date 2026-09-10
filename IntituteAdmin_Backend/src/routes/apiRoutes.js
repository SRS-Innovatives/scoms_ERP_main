/**
 * Institute Admin API Routes Definition
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const authController = require('../controllers/authController');
const setupController = require('../controllers/setupController');
const staffController = require('../controllers/staffController');
const studentController = require('../controllers/studentController');
const feeController = require('../controllers/feeController');
const feeEngineController = require('../controllers/feeEngineController');
const dashboardController = require('../controllers/dashboardController');
const announcementController = require('../controllers/announcementController');
const attendanceController = require('../controllers/attendanceController');
const reportController = require('../controllers/reportController');
const timetableController = require('../controllers/timetableController');
const examController = require('../controllers/examController');
const libraryController = require('../controllers/libraryController');
const transportController = require('../controllers/transportController');
const hostelController = require('../controllers/hostelController');
const inventoryController = require('../controllers/inventoryController');
const certificateController = require('../controllers/certificateController');
const certificateTemplateController = require('../controllers/certificateTemplateController');
const settingsController = require('../controllers/settingsController');
const institutionProfileController = require('../controllers/institutionProfileController');
const eventController = require('../controllers/eventController');
const feedbackController = require('../controllers/feedbackController');
const jobPostingController = require('../controllers/jobPostingController');
const grievanceController = require('../controllers/grievanceController');
const clubController = require('../controllers/clubController');
const homeworkController = require('../controllers/homeworkController');
const {
  requireAuth, requireTenant, requireModule, handleForgotPassword, handleVerifyOtp, handleResetPassword,
  handleGetNotifications, handleGetUnreadCount, handleMarkNotificationRead, handleMarkAllNotificationsRead,
} = require('../../../shared');

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

// Notification Center
router.get('/notifications', handleGetNotifications);
router.get('/notifications/unread-count', handleGetUnreadCount);
router.patch('/notifications/:id/read', handleMarkNotificationRead);
router.patch('/notifications/read-all', handleMarkAllNotificationsRead);

// Dashboard
router.get('/dashboard', dashboardController.getDashboard);

// Own Institution Profile
router.patch('/institution-profile', institutionProfileController.updateProfile);

// Setup Routes
router.get('/setup/academic-years', setupController.getAcademicYears);
router.post('/setup/academic-years', setupController.createAcademicYear);
router.patch('/setup/academic-years/:id', setupController.updateAcademicYear);
router.delete('/setup/academic-years/:id', setupController.deleteAcademicYear);

router.get('/setup/departments', setupController.getDepartments);
router.post('/setup/departments', setupController.createDepartment);
router.patch('/setup/departments/:id', setupController.updateDepartment);
router.delete('/setup/departments/:id', setupController.deleteDepartment);

router.get('/setup/courses', setupController.getCourses);
router.post('/setup/courses', setupController.createCourse);
router.patch('/setup/courses/:id', setupController.updateCourse);
router.delete('/setup/courses/:id', setupController.deleteCourse);

router.get('/setup/semesters', setupController.getSemesters);
router.post('/setup/semesters', setupController.createSemester);
router.patch('/setup/semesters/:id', setupController.updateSemester);
router.delete('/setup/semesters/:id', setupController.deleteSemester);

router.get('/setup/sections', setupController.getSections);
router.post('/setup/sections', setupController.createSection);
router.patch('/setup/sections/:id', setupController.updateSection);
router.delete('/setup/sections/:id', setupController.deleteSection);

router.get('/setup/subjects', setupController.getSubjects);
router.post('/setup/subjects', setupController.createSubject);
router.patch('/setup/subjects/:id', setupController.updateSubject);
router.delete('/setup/subjects/:id', setupController.deleteSubject);

// Student Routes
router.use('/students', requireModule('student'));
router.get('/students', studentController.getStudents);
router.post('/students/admission', studentController.createStudentAdmission);
router.get('/students/bulk-admission/template', studentController.getBulkAdmissionTemplate);
router.post('/students/bulk-admission', upload.single('file'), studentController.bulkStudentAdmission);
router.post('/students/promote', studentController.promoteStudents);
router.get('/students/:id', studentController.getStudentById);

// Staff Routes
router.use('/staff', requireModule('staff'));
router.get('/staff', staffController.getStaff);
router.post('/staff', staffController.createStaff);
router.get('/staff/salaries', staffController.getSalaries);
router.get('/staff/attendance', staffController.getStaffAttendance);
router.post('/staff/attendance', staffController.markStaffAttendance);
router.get('/staff/leave', staffController.getLeaveRequests);
router.post('/staff/leave', staffController.createLeaveRequest);
router.patch('/staff/leave/:id', staffController.updateLeaveStatus);
router.get('/staff/assignments', staffController.getTeacherAssignments);
router.post('/staff/assignments', staffController.assignTeacher);
router.delete('/staff/assignments/:id', staffController.removeTeacherAssignment);
router.get('/staff/:id', staffController.getStaffById);
router.patch('/staff/:id', staffController.updateStaff);
router.post('/staff/:staffId/qualifications', staffController.addQualification);
router.post('/staff/:staffId/experience', staffController.addExperience);
router.post('/staff/:staffId/salary', staffController.setSalary);

// Fee Routes
router.use('/fees', requireModule('fee'));
router.get('/fees/categories', feeController.getFeeCategories);
router.get('/fees/structures', feeController.getFeeStructures);
router.post('/fees/structures', feeController.createFeeStructure);
router.delete('/fees/structures/:id', feeController.deleteFeeStructure);
router.get('/fees/assignments', feeController.getStudentAssignments);
router.post('/fees/assignments', feeController.assignFeeToStudent);
router.post('/fees/assignments/bulk', feeController.bulkAssignFee);
router.get('/fees/installments', feeController.getInstallments);
router.post('/fees/installments', feeController.createInstallmentPlan);
router.post('/fees/collect', feeController.collectOfflineFee);
router.get('/fees/receipts/:id', feeController.getReceipt);
router.get('/fees/challans', feeController.getChallans);
router.post('/fees/challans', feeController.createChallan);
router.get('/fees/scholarships', feeController.getScholarships);
router.patch('/fees/assignments/:id/scholarship', feeController.applyScholarship);
router.get('/fees/refunds', feeController.getRefunds);
router.post('/fees/refunds', feeController.createRefund);
router.patch('/fees/refunds/:id', feeController.processRefund);
router.get('/fees/pending', feeController.getPendingFees);
router.get('/fees/dashboard', feeController.getFeeDashboard);
router.get('/fees/reports', feeController.getFeeReports);
router.get('/fees/daybook', feeController.getDayBook);

// Dynamic Fee Engine — metadata-driven fee heads, structure builder, multi-item payments
router.get('/fee-heads/categories', feeEngineController.getFeeCategoriesV2);
router.post('/fee-heads/categories', feeEngineController.createFeeCategory);
router.get('/fee-heads', feeEngineController.getFeeHeads);
router.post('/fee-heads', feeEngineController.createFeeHead);
router.patch('/fee-heads/:id', feeEngineController.updateFeeHead);
router.delete('/fee-heads/:id', feeEngineController.deactivateFeeHead);

router.get('/fee-structures', feeEngineController.getFeeStructuresV2);
router.post('/fee-structures', feeEngineController.createFeeStructureV2);
router.get('/fee-structures/:id', feeEngineController.getFeeStructureByIdV2);
router.patch('/fee-structures/:id', feeEngineController.updateFeeStructureV2);
router.post('/fee-structures/:id/publish', feeEngineController.publishFeeStructure);
router.post('/fee-structures/:id/archive', feeEngineController.archiveFeeStructure);
router.post('/fee-structures/:id/duplicate', feeEngineController.duplicateFeeStructure);
router.post('/fee-structures/:id/assign', feeEngineController.assignStructureToStudents);

router.get('/students/:id/fee-items', feeEngineController.getStudentFeeItems);

router.post('/fee-payments', feeEngineController.collectFeePaymentV2);
router.post('/fee-receipts/:id/reprint', feeEngineController.reprintReceiptV2);

// Homework — read-only institution-wide oversight of what staff have posted
router.use('/homework', requireModule('homework'));
router.get('/homework', homeworkController.getHomeworkList);
router.get('/homework/:id', homeworkController.getHomeworkById);

// Library
router.use('/library', requireModule('library'));
router.get('/library/books', libraryController.getBooks);
router.post('/library/books', libraryController.createBook);
router.post('/library/issue', libraryController.issueBook);
router.get('/library/issues', libraryController.getActiveIssues);
router.post('/library/return', libraryController.returnBook);
router.get('/library/fines', libraryController.getFines);
router.patch('/library/fines/:id/collect', libraryController.collectFine);
router.get('/library/reports', libraryController.getLibraryReports);

// Transport
router.use('/transport', requireModule('transport'));
router.get('/transport/vehicles', transportController.getVehicles);
router.post('/transport/vehicles', transportController.createVehicle);
router.get('/transport/routes', transportController.getRoutes);
router.post('/transport/routes', transportController.createRoute);
router.get('/transport/mappings', transportController.getMappings);
router.post('/transport/mappings', transportController.assignStudentToRoute);
router.get('/transport/trips', transportController.getTrips);
router.post('/transport/trips/complete', transportController.markTripComplete);

// Hostel
router.use('/hostel', requireModule('hostel'));
router.get('/hostel/hostels', hostelController.getHostels);
router.post('/hostel/hostels', hostelController.createHostel);
router.get('/hostel/beds', hostelController.getBeds);
router.post('/hostel/beds', hostelController.createBed);
router.post('/hostel/beds/allocate', hostelController.allocateBed);
router.patch('/hostel/beds/:id/vacate', hostelController.vacateBed);
router.get('/hostel/attendance', hostelController.getAttendance);
router.post('/hostel/attendance', hostelController.markAttendance);
router.get('/hostel/mess-fees', hostelController.getMessFees);
router.get('/hostel/visitors', hostelController.getVisitors);
router.post('/hostel/visitors/checkin', hostelController.checkInVisitor);
router.patch('/hostel/visitors/:id/checkout', hostelController.checkOutVisitor);

// Inventory & Assets
router.use('/inventory', requireModule('inventory'));
router.get('/inventory/vendors', inventoryController.getVendors);
router.post('/inventory/vendors', inventoryController.createVendor);
router.get('/inventory/assets', inventoryController.getAssets);
router.post('/inventory/assets', inventoryController.createAsset);
router.get('/inventory/computer-labs', inventoryController.getComputerLabs);
router.post('/inventory/computer-labs', inventoryController.createComputerLab);
router.get('/inventory/stock-items', inventoryController.getStockItems);
router.post('/inventory/stock-items', inventoryController.createStockItem);
router.post('/inventory/stock-transactions', inventoryController.recordStockTransaction);
router.get('/inventory/stock-transactions', inventoryController.getStockTransactions);
router.get('/inventory/purchase-orders', inventoryController.getPurchaseOrders);
router.post('/inventory/purchase-orders', inventoryController.createPurchaseOrder);
router.patch('/inventory/purchase-orders/:id/status', inventoryController.updatePurchaseOrderStatus);

// Certificates
router.use('/certificates', requireModule('certificates'));
router.get('/certificates', certificateController.getCertificates);
router.post('/certificates/generate', certificateController.generateCertificate);
router.use('/certificate-requests', requireModule('certificates'));
router.get('/certificate-requests', certificateController.getCertificateRequests);
router.patch('/certificate-requests/:id', certificateController.resolveCertificateRequest);

// Dynamic Certificate Engine — catalog, format customization, dynamic generation
router.use('/certificate-templates', requireModule('certificates'));
router.get('/certificate-templates/catalog', certificateTemplateController.getCatalog);
router.get('/certificate-templates/:code/definition', certificateTemplateController.getDefinition);
router.get('/certificate-templates/:code/format', certificateTemplateController.getFormatSettings);
router.patch('/certificate-templates/:code/format', certificateTemplateController.updateFormatSettings);
router.post('/certificate-templates/:code/format/reset', certificateTemplateController.resetFormatSettings);
router.post('/certificate-templates/:code/generate', certificateTemplateController.generateFromTemplate);

// Settings
router.get('/settings/audit-logs', settingsController.getAuditLogs);
router.get('/settings/roles', settingsController.getUserRoles);
router.get('/settings/permissions', settingsController.getPermissionMatrix);
router.get('/settings', settingsController.getSettings);
router.patch('/settings', settingsController.updateSettings);
router.post('/settings/backup', settingsController.requestBackup);

// Announcements
router.use('/announcements', requireModule('communication'));
router.get('/announcements', announcementController.getAnnouncements);
router.post('/announcements', announcementController.createAnnouncement);
router.delete('/announcements/:id', announcementController.deleteAnnouncement);

// Campus Events
router.use('/events', requireModule('communication'));
router.get('/events', eventController.getEvents);
router.post('/events', eventController.createEvent);
router.delete('/events/:id', eventController.deleteEvent);

// Student Grievances
router.get('/grievances', grievanceController.getGrievances);
router.patch('/grievances/:id', grievanceController.updateGrievance);

// Clubs & Societies
router.use('/clubs', requireModule('communication'));
router.get('/clubs', clubController.getClubs);
router.post('/clubs', clubController.createClub);
router.delete('/clubs/:id', clubController.deleteClub);

// Anonymous Feedback Aggregates
router.get('/feedback/summary', feedbackController.getFeedbackSummary);

// Placement Cell — Internships & Placements
router.get('/postings', jobPostingController.getPostings);
router.post('/postings', jobPostingController.createPosting);
router.patch('/postings/:id/close', jobPostingController.closePosting);
router.get('/postings/:id/applications', jobPostingController.getApplications);
router.patch('/postings/applications/:id', jobPostingController.updateApplicationStatus);

// Attendance Oversight
router.use('/attendance', requireModule('attendance'));
router.get('/attendance/register', attendanceController.getDailyRegister);
router.get('/attendance/absentees', attendanceController.getAbsentees);
router.post('/attendance/absentees/notify', attendanceController.notifyAbsentees);

// Dynamic Report Center
router.get('/reports/catalog', reportController.getCatalog);
router.get('/reports/history', reportController.getHistory);
router.get('/reports/saved', reportController.getSavedReports);
router.post('/reports/saved', reportController.createSavedReport);
router.delete('/reports/saved/:id', reportController.deleteSavedReport);
router.get('/reports/filter-options', reportController.getFilterOptions);
router.get('/reports/:code/definition', reportController.getDefinition);
router.post('/reports/:code/preview', reportController.previewReport);
router.post('/reports/:code/generate', reportController.generateReport);
router.post('/reports/:code/export', reportController.exportReport);

// Institution-specific report requests
router.post('/report-requests', reportController.createReportRequest);
router.get('/report-requests', reportController.getReportRequests);
router.get('/attendance/reports', attendanceController.getReports);

// Timetable
router.use('/timetable', requireModule('timetable'));
router.get('/timetable', timetableController.getTimetable);
router.put('/timetable/:timetableId/entries', timetableController.saveEntries);
router.get('/timetable/teacher/:staffId', timetableController.getTeacherTimetable);

// Examination
router.use('/exams', requireModule('examination'));
router.use('/exam-schedules', requireModule('examination'));
router.get('/exams', examController.getExams);
router.post('/exams', examController.createExam);
router.patch('/exams/:id/status', examController.updateExamStatus);
router.get('/exams/:examId/rank-list', examController.getRankList);

router.get('/exam-schedules', examController.getSchedules);
router.post('/exam-schedules', examController.createSchedule);
router.delete('/exam-schedules/:id', examController.deleteSchedule);
router.get('/exam-schedules/:scheduleId/marks', examController.getMarksRoster);
router.post('/exam-schedules/:scheduleId/marks', examController.saveMarks);
router.post('/exam-schedules/:scheduleId/publish', examController.publishResults);

module.exports = router;
