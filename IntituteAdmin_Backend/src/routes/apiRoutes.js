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
const researchController = require('../controllers/researchController');
const alumniController = require('../controllers/alumniController');
const affiliationController = require('../controllers/affiliationController');
const degreeController = require('../controllers/degreeController');
const textbookController = require('../controllers/textbookController');
const grievanceController = require('../controllers/grievanceController');
const clubController = require('../controllers/clubController');
const homeworkController = require('../controllers/homeworkController');
const enquiryController = require('../controllers/enquiryController');
const preAdmissionController = require('../controllers/preAdmissionController');
const admissionCustomFieldController = require('../controllers/admissionCustomFieldController');
const institutionCustomListController = require('../controllers/institutionCustomListController');
const payrollController = require('../controllers/payrollController');
const disciplineController = require('../controllers/disciplineController');
const healthController = require('../controllers/healthController');
const visitorController = require('../controllers/visitorController');
const galleryController = require('../controllers/galleryController');
const gradeScaleController = require('../controllers/gradeScaleController');
const broadcastController = require('../controllers/broadcastController');
const templateController = require('../controllers/templateController');
const moduleConfigController = require('../controllers/moduleConfigController');
const academicCalendarController = require('../controllers/academicCalendarController');
const notificationSchedulerController = require('../controllers/notificationSchedulerController');
const studentDocumentController = require('../controllers/studentDocumentController');
const expenseController = require('../controllers/expenseController');
const budgetController = require('../controllers/budgetController');
const studentExitController = require('../controllers/studentExitController');
const recruitmentController = require('../controllers/recruitmentController');
const workflowController = require('../controllers/workflowController');
const dynamicReportController = require('../controllers/dynamicReportController');
const automationController = require('../controllers/automationController');
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

// Dashboard
router.get('/dashboard', dashboardController.getDashboard);

// Own Institution Profile
router.patch('/institution-profile', institutionProfileController.updateProfile);

// Module Configuration (Phase 4) — tenant-specific config for a Module Registry
// assignment (e.g. Transport's "Enable GPS" toggle). No-op / informational until this
// institution has real InstitutionModuleAssignment rows (see Phase 1).
router.get('/module-config', moduleConfigController.getAssignedModules);
router.get('/module-config/:moduleKey', moduleConfigController.getModuleConfig);
router.patch('/module-config/:moduleKey', moduleConfigController.updateModuleConfig);

// Expense Management
router.use('/expenses', requireModule('expense_management'));
router.get('/expenses', shadowPermission(PERMISSIONS.EXPENSES_VIEW), expenseController.getExpenses);
router.get('/expenses/summary', shadowPermission(PERMISSIONS.EXPENSES_VIEW), expenseController.getExpenseSummary);
router.post('/expenses', shadowPermission(PERMISSIONS.EXPENSES_CREATE), expenseController.createExpense);
router.patch('/expenses/:id/approve', shadowPermission(PERMISSIONS.EXPENSES_APPROVE), expenseController.approveExpense);
router.patch('/expenses/:id/reject', shadowPermission(PERMISSIONS.EXPENSES_APPROVE), expenseController.rejectExpense);
router.patch('/expenses/:id/pay', shadowPermission(PERMISSIONS.EXPENSES_APPROVE), expenseController.markExpensePaid);
router.delete('/expenses/:id', shadowPermission(PERMISSIONS.EXPENSES_CREATE), expenseController.deleteExpense);

// Budget Management (sub-feature of Expense Management — same module gate)
router.use('/budgets', requireModule('expense_management'));
router.get('/budgets', shadowPermission(PERMISSIONS.EXPENSES_VIEW), budgetController.getBudgets);
router.get('/budgets/vs-actual', shadowPermission(PERMISSIONS.EXPENSES_VIEW), budgetController.getBudgetVsActual);
router.post('/budgets', shadowPermission(PERMISSIONS.EXPENSES_APPROVE), budgetController.createOrUpdateBudget);
router.delete('/budgets/:id', shadowPermission(PERMISSIONS.EXPENSES_APPROVE), budgetController.deleteBudget);

// HR Recruitment
router.use('/recruitment', requireModule('hr_recruitment'));
router.get('/recruitment/openings', shadowPermission(PERMISSIONS.STAFF_VIEW), recruitmentController.getJobOpenings);
router.post('/recruitment/openings', shadowPermission(PERMISSIONS.STAFF_CREATE), recruitmentController.createJobOpening);
router.patch('/recruitment/openings/:id/close', shadowPermission(PERMISSIONS.STAFF_UPDATE), recruitmentController.closeJobOpening);
router.get('/recruitment/openings/:id/applications', shadowPermission(PERMISSIONS.STAFF_VIEW), recruitmentController.getApplications);
router.post('/recruitment/openings/:id/applications', shadowPermission(PERMISSIONS.STAFF_CREATE), recruitmentController.addApplication);
router.patch('/recruitment/applications/:applicationId', shadowPermission(PERMISSIONS.STAFF_UPDATE), recruitmentController.updateApplicationStatus);

// Event / Automation Engine — "when X event fires, send this notification"
router.use('/automation', requireModule('automation_engine'));
router.get('/automation/rules', automationController.getRules);
router.get('/automation/event-types', automationController.getEventTypes);
router.post('/automation/rules', automationController.createRule);
router.patch('/automation/rules/:id', automationController.updateRule);
router.delete('/automation/rules/:id', automationController.deleteRule);
router.get('/automation/events', automationController.getEventHistory);
router.post('/automation/test-fire', automationController.testFireEvent);

// Workflow Engine — generic, configurable multi-step approval chains
router.use('/workflows', requireModule('workflow_engine'));
router.get('/workflows/definitions', workflowController.getDefinitions);
router.post('/workflows/definitions', workflowController.createDefinition);
router.patch('/workflows/definitions/:id', workflowController.updateDefinition);
router.post('/workflows/instances', workflowController.startInstance);
router.get('/workflows/instances/for-entity', workflowController.getInstancesForEntity);
router.get('/workflows/instances/my-approvals', workflowController.getMyPendingApprovals);
router.get('/workflows/instances/:id', workflowController.getInstance);
router.post('/workflows/instances/:id/decide', workflowController.decideStep);

// Academic Calendar
router.use('/academic-calendar', requireModule('academic_calendar'));
router.get('/academic-calendar', shadowPermission(PERMISSIONS.ACADEMICS_VIEW), academicCalendarController.getEvents);
router.post('/academic-calendar', shadowPermission(PERMISSIONS.ACADEMICS_MANAGE), academicCalendarController.createEvent);
router.patch('/academic-calendar/:id', shadowPermission(PERMISSIONS.ACADEMICS_MANAGE), academicCalendarController.updateEvent);
router.delete('/academic-calendar/:id', shadowPermission(PERMISSIONS.ACADEMICS_MANAGE), academicCalendarController.deleteEvent);

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

router.get('/setup/programs', setupController.getPrograms);
router.post('/setup/programs', setupController.createProgram);
router.patch('/setup/programs/:id', setupController.updateProgram);
router.delete('/setup/programs/:id', setupController.deleteProgram);

router.get('/setup/batches', setupController.getBatches);
router.post('/setup/batches', setupController.createBatch);
router.patch('/setup/batches/:id', setupController.updateBatch);
router.delete('/setup/batches/:id', setupController.deleteBatch);

router.get('/setup/sections', setupController.getSections);
router.post('/setup/sections', setupController.createSection);
router.patch('/setup/sections/:id', setupController.updateSection);
router.delete('/setup/sections/:id', setupController.deleteSection);

router.get('/setup/subjects', setupController.getSubjects);
router.post('/setup/subjects', setupController.createSubject);
router.post('/setup/subjects/bulk-upload', upload.single('file'), setupController.bulkUploadSubjects);
router.get('/setup/subjects/class-mapping', setupController.getSubjectClassMappingOverview);
router.put('/setup/subjects/:id/class-mapping', setupController.setSubjectClassMapping);
router.patch('/setup/subjects/:id', setupController.updateSubject);
router.delete('/setup/subjects/:id', setupController.deleteSubject);

// Student Routes
router.use('/students', requireModule('student'));
router.get('/students', shadowPermission(PERMISSIONS.STUDENTS_VIEW), studentController.getStudents);
router.post('/students/admission', shadowPermission(PERMISSIONS.STUDENTS_CREATE), studentController.createStudentAdmission);
router.get('/students/bulk-admission/template', studentController.getBulkAdmissionTemplate);
router.post('/students/bulk-admission', upload.single('file'), shadowPermission(PERMISSIONS.STUDENTS_CREATE), studentController.bulkStudentAdmission);
router.post('/students/promote', shadowPermission(PERMISSIONS.STUDENTS_PROMOTE), studentController.promoteStudents);
// Registered before /students/:id below, which is a 2-segment wildcard that would
// otherwise swallow this path first (Express matches routes in registration order).
router.get('/students/exits', shadowPermission(PERMISSIONS.STUDENTS_VIEW), studentExitController.getExitRecords);
router.post('/students/exits', shadowPermission(PERMISSIONS.STUDENTS_UPDATE), studentExitController.requestExit);
router.get('/students/:id', shadowPermission(PERMISSIONS.STUDENTS_VIEW), studentController.getStudentById);

// Student Documents (real documents attached to a student's record) — kept under the
// /students prefix so they inherit requireModule('student') from the router.use above.
router.get('/students/:studentId/documents', shadowPermission(PERMISSIONS.STUDENTS_VIEW), studentDocumentController.getStudentDocuments);
router.post('/students/:studentId/documents', shadowPermission(PERMISSIONS.STUDENTS_UPDATE), studentDocumentController.uploadDocument);
router.get('/students/documents/:id', shadowPermission(PERMISSIONS.STUDENTS_VIEW), studentDocumentController.getDocumentById);
router.delete('/students/documents/:id', shadowPermission(PERMISSIONS.STUDENTS_UPDATE), studentDocumentController.deleteDocument);

// Student Withdrawal / Transfer — /students/exits/:id/... routes only (the two
// GET/POST /students/exits list/create routes are registered above /students/:id —
// see note there — since /students/:id is a 2-segment wildcard that would otherwise
// swallow /students/exits first, being registered earlier in this file).
router.get('/students/exits/:id/clearance', shadowPermission(PERMISSIONS.STUDENTS_VIEW), studentExitController.getClearanceStatus);
router.patch('/students/exits/:id/clearance', shadowPermission(PERMISSIONS.STUDENTS_UPDATE), studentExitController.updateClearance);
router.post('/students/exits/:id/approve', shadowPermission(PERMISSIONS.STUDENTS_UPDATE), studentExitController.approveExit);
router.post('/students/exits/:id/complete', shadowPermission(PERMISSIONS.STUDENTS_UPDATE), studentExitController.completeExit);
router.post('/students/exits/:id/cancel', shadowPermission(PERMISSIONS.STUDENTS_UPDATE), studentExitController.cancelExit);

// Staff Routes
router.use('/staff', requireModule('staff'));
router.get('/staff', shadowPermission(PERMISSIONS.STAFF_VIEW), staffController.getStaff);
router.post('/staff', shadowPermission(PERMISSIONS.STAFF_CREATE), staffController.createStaff);
router.get('/staff/salaries', shadowPermission(PERMISSIONS.STAFF_VIEW), staffController.getSalaries);
router.get('/staff/attendance', shadowPermission(PERMISSIONS.ATTENDANCE_VIEW), staffController.getStaffAttendance);
router.post('/staff/attendance', shadowPermission(PERMISSIONS.ATTENDANCE_MARK), staffController.markStaffAttendance);
router.get('/staff/leave', shadowPermission(PERMISSIONS.LEAVE_VIEW), staffController.getLeaveRequests);
router.post('/staff/leave', shadowPermission(PERMISSIONS.LEAVE_APPLY), staffController.createLeaveRequest);
router.patch('/staff/leave/:id', shadowPermission(PERMISSIONS.LEAVE_APPROVE), staffController.updateLeaveStatus);
router.get('/staff/assignments', shadowPermission(PERMISSIONS.STAFF_VIEW), staffController.getTeacherAssignments);
router.post('/staff/assignments', shadowPermission(PERMISSIONS.STAFF_UPDATE), staffController.assignTeacher);
router.delete('/staff/assignments/:id', shadowPermission(PERMISSIONS.STAFF_UPDATE), staffController.removeTeacherAssignment);
router.get('/staff/:id', shadowPermission(PERMISSIONS.STAFF_VIEW), staffController.getStaffById);
router.patch('/staff/:id', shadowPermission(PERMISSIONS.STAFF_UPDATE), staffController.updateStaff);
router.post('/staff/:staffId/qualifications', shadowPermission(PERMISSIONS.STAFF_UPDATE), staffController.addQualification);
router.post('/staff/:staffId/experience', shadowPermission(PERMISSIONS.STAFF_UPDATE), staffController.addExperience);
router.post('/staff/:staffId/salary', shadowPermission(PERMISSIONS.STAFF_UPDATE), staffController.setSalary);

// Fee Routes
router.use('/fees', requireModule('fee'));
router.get('/fees/categories', shadowPermission(PERMISSIONS.FEES_VIEW), feeController.getFeeCategories);
router.get('/fees/structures', shadowPermission(PERMISSIONS.FEES_VIEW), feeController.getFeeStructures);
router.post('/fees/structures', shadowPermission(PERMISSIONS.FEES_SETUP), feeController.createFeeStructure);
router.delete('/fees/structures/:id', shadowPermission(PERMISSIONS.FEES_SETUP), feeController.deleteFeeStructure);
router.get('/fees/assignments', shadowPermission(PERMISSIONS.FEES_VIEW), feeController.getStudentAssignments);
router.post('/fees/assignments', shadowPermission(PERMISSIONS.FEES_SETUP), feeController.assignFeeToStudent);
router.post('/fees/assignments/bulk', shadowPermission(PERMISSIONS.FEES_SETUP), feeController.bulkAssignFee);
router.get('/fees/installments', shadowPermission(PERMISSIONS.FEES_VIEW), feeController.getInstallments);
router.post('/fees/installments', shadowPermission(PERMISSIONS.FEES_SETUP), feeController.createInstallmentPlan);
router.post('/fees/collect', shadowPermission(PERMISSIONS.FEES_COLLECT), feeController.collectOfflineFee);
router.get('/fees/receipts/:id', shadowPermission(PERMISSIONS.FEES_VIEW), feeController.getReceipt);
router.get('/fees/challans', shadowPermission(PERMISSIONS.FEES_VIEW), feeController.getChallans);
router.post('/fees/challans', shadowPermission(PERMISSIONS.FEES_COLLECT), feeController.createChallan);
router.get('/fees/scholarships', shadowPermission(PERMISSIONS.FEES_VIEW), feeController.getScholarships);
router.patch('/fees/assignments/:id/scholarship', shadowPermission(PERMISSIONS.FEES_SETUP), feeController.applyScholarship);
router.get('/fees/refunds', shadowPermission(PERMISSIONS.FEES_VIEW), feeController.getRefunds);
router.post('/fees/refunds', shadowPermission(PERMISSIONS.FEES_REFUND), feeController.createRefund);
router.patch('/fees/refunds/:id', shadowPermission(PERMISSIONS.FEES_REFUND), feeController.processRefund);
router.get('/fees/pending', shadowPermission(PERMISSIONS.FEES_VIEW), feeController.getPendingFees);
router.get('/fees/dashboard', shadowPermission(PERMISSIONS.FEES_VIEW), feeController.getFeeDashboard);
router.get('/fees/reports', shadowPermission(PERMISSIONS.FEES_VIEW), feeController.getFeeReports);
router.get('/fees/daybook', shadowPermission(PERMISSIONS.FEES_VIEW), feeController.getDayBook);

// Dynamic Fee Engine — metadata-driven fee heads, structure builder, multi-item payments
router.get('/fee-heads/categories', shadowPermission(PERMISSIONS.FEES_VIEW), feeEngineController.getFeeCategoriesV2);
router.post('/fee-heads/categories', shadowPermission(PERMISSIONS.FEES_SETUP), feeEngineController.createFeeCategory);
router.get('/fee-heads', shadowPermission(PERMISSIONS.FEES_VIEW), feeEngineController.getFeeHeads);
router.post('/fee-heads', shadowPermission(PERMISSIONS.FEES_SETUP), feeEngineController.createFeeHead);
router.patch('/fee-heads/:id', shadowPermission(PERMISSIONS.FEES_SETUP), feeEngineController.updateFeeHead);
router.delete('/fee-heads/:id', shadowPermission(PERMISSIONS.FEES_SETUP), feeEngineController.deactivateFeeHead);

router.get('/fee-structures', shadowPermission(PERMISSIONS.FEES_VIEW), feeEngineController.getFeeStructuresV2);
router.post('/fee-structures', shadowPermission(PERMISSIONS.FEES_SETUP), feeEngineController.createFeeStructureV2);
router.get('/fee-structures/:id', shadowPermission(PERMISSIONS.FEES_VIEW), feeEngineController.getFeeStructureByIdV2);
router.patch('/fee-structures/:id', shadowPermission(PERMISSIONS.FEES_SETUP), feeEngineController.updateFeeStructureV2);
router.post('/fee-structures/:id/publish', shadowPermission(PERMISSIONS.FEES_SETUP), feeEngineController.publishFeeStructure);
router.post('/fee-structures/:id/archive', shadowPermission(PERMISSIONS.FEES_SETUP), feeEngineController.archiveFeeStructure);
router.post('/fee-structures/:id/duplicate', shadowPermission(PERMISSIONS.FEES_SETUP), feeEngineController.duplicateFeeStructure);
router.post('/fee-structures/:id/assign', shadowPermission(PERMISSIONS.FEES_SETUP), feeEngineController.assignStructureToStudents);

router.get('/students/:id/fee-items', shadowPermission(PERMISSIONS.FEES_VIEW), feeEngineController.getStudentFeeItems);

router.post('/fee-payments', shadowPermission(PERMISSIONS.FEES_COLLECT), feeEngineController.collectFeePaymentV2);
router.post('/fee-receipts/:id/reprint', shadowPermission(PERMISSIONS.FEES_VIEW), feeEngineController.reprintReceiptV2);

// Homework — read-only institution-wide oversight of what staff have posted
router.use('/homework', requireModule('homework'));
router.get('/homework', shadowPermission(PERMISSIONS.ASSIGNMENTS_VIEW), homeworkController.getHomeworkList);
router.get('/homework/:id', shadowPermission(PERMISSIONS.ASSIGNMENTS_VIEW), homeworkController.getHomeworkById);

// Library
router.use('/library', requireModule('library'));
router.get('/library/books', shadowPermission(PERMISSIONS.LIBRARY_MANAGE), libraryController.getBooks);
router.post('/library/books', shadowPermission(PERMISSIONS.LIBRARY_MANAGE), libraryController.createBook);
router.post('/library/issue', shadowPermission(PERMISSIONS.LIBRARY_MANAGE), libraryController.issueBook);
router.get('/library/issues', shadowPermission(PERMISSIONS.LIBRARY_MANAGE), libraryController.getActiveIssues);
router.post('/library/return', shadowPermission(PERMISSIONS.LIBRARY_MANAGE), libraryController.returnBook);
router.get('/library/fines', shadowPermission(PERMISSIONS.LIBRARY_MANAGE), libraryController.getFines);
router.patch('/library/fines/:id/collect', shadowPermission(PERMISSIONS.LIBRARY_MANAGE), libraryController.collectFine);
router.get('/library/reports', shadowPermission(PERMISSIONS.LIBRARY_MANAGE), libraryController.getLibraryReports);
router.get('/library/members', shadowPermission(PERMISSIONS.LIBRARY_MANAGE), libraryController.getMembers);
router.post('/library/members', shadowPermission(PERMISSIONS.LIBRARY_MANAGE), libraryController.registerMember);
router.patch('/library/members/:id/status', shadowPermission(PERMISSIONS.LIBRARY_MANAGE), libraryController.updateMemberStatus);

// Transport
router.use('/transport', requireModule('transport'));
router.get('/transport/vehicles', shadowPermission(PERMISSIONS.TRANSPORT_MANAGE), transportController.getVehicles);
router.post('/transport/vehicles', shadowPermission(PERMISSIONS.TRANSPORT_MANAGE), transportController.createVehicle);
router.get('/transport/routes', shadowPermission(PERMISSIONS.TRANSPORT_MANAGE), transportController.getRoutes);
router.post('/transport/routes', shadowPermission(PERMISSIONS.TRANSPORT_MANAGE), transportController.createRoute);
router.get('/transport/mappings', shadowPermission(PERMISSIONS.TRANSPORT_MANAGE), transportController.getMappings);
router.post('/transport/mappings', shadowPermission(PERMISSIONS.TRANSPORT_MANAGE), transportController.assignStudentToRoute);
router.get('/transport/trips', shadowPermission(PERMISSIONS.TRANSPORT_MANAGE), transportController.getTrips);
router.post('/transport/trips/complete', shadowPermission(PERMISSIONS.TRANSPORT_MANAGE), transportController.markTripComplete);

// Hostel
router.use('/hostel', requireModule('hostel'));
router.get('/hostel/hostels', shadowPermission(PERMISSIONS.HOSTEL_MANAGE), hostelController.getHostels);
router.post('/hostel/hostels', shadowPermission(PERMISSIONS.HOSTEL_MANAGE), hostelController.createHostel);
router.get('/hostel/beds', shadowPermission(PERMISSIONS.HOSTEL_MANAGE), hostelController.getBeds);
router.post('/hostel/beds', shadowPermission(PERMISSIONS.HOSTEL_MANAGE), hostelController.createBed);
router.post('/hostel/beds/allocate', shadowPermission(PERMISSIONS.HOSTEL_MANAGE), hostelController.allocateBed);
router.patch('/hostel/beds/:id/vacate', shadowPermission(PERMISSIONS.HOSTEL_MANAGE), hostelController.vacateBed);
router.get('/hostel/attendance', shadowPermission(PERMISSIONS.HOSTEL_MANAGE), hostelController.getAttendance);
router.post('/hostel/attendance', shadowPermission(PERMISSIONS.HOSTEL_MANAGE), hostelController.markAttendance);
router.get('/hostel/mess-fees', shadowPermission(PERMISSIONS.HOSTEL_MANAGE), hostelController.getMessFees);
router.get('/hostel/visitors', shadowPermission(PERMISSIONS.HOSTEL_MANAGE), hostelController.getVisitors);
router.post('/hostel/visitors/checkin', shadowPermission(PERMISSIONS.HOSTEL_MANAGE), hostelController.checkInVisitor);
router.patch('/hostel/visitors/:id/checkout', shadowPermission(PERMISSIONS.HOSTEL_MANAGE), hostelController.checkOutVisitor);

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
router.get('/inventory/maintenance', inventoryController.getMaintenanceRecords);
router.post('/inventory/maintenance', inventoryController.scheduleMaintenance);
router.patch('/inventory/maintenance/:id', inventoryController.updateMaintenanceStatus);

// Certificates
router.use('/certificates', requireModule('certificates'));
router.get('/certificates', shadowPermission(PERMISSIONS.CERTIFICATES_GENERATE), certificateController.getCertificates);
router.post('/certificates/generate', shadowPermission(PERMISSIONS.CERTIFICATES_GENERATE), certificateController.generateCertificate);
router.use('/certificate-requests', requireModule('certificates'));
router.get('/certificate-requests', shadowPermission(PERMISSIONS.CERTIFICATES_GENERATE), certificateController.getCertificateRequests);
router.patch('/certificate-requests/:id', shadowPermission(PERMISSIONS.CERTIFICATES_GENERATE), certificateController.resolveCertificateRequest);

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
router.post('/announcements', shadowPermission(PERMISSIONS.ANNOUNCEMENTS_CREATE), announcementController.createAnnouncement);
router.delete('/announcements/:id', shadowPermission(PERMISSIONS.ANNOUNCEMENTS_CREATE), announcementController.deleteAnnouncement);

// Bulk SMS, Email & WhatsApp Broadcast
router.use('/broadcast', requireModule('communication'));
router.post('/broadcast/sms', shadowPermission(PERMISSIONS.NOTIFICATIONS_SEND), broadcastController.broadcastSms);
router.get('/broadcast/sms/logs', broadcastController.getSmsLogs);
router.post('/broadcast/email', shadowPermission(PERMISSIONS.NOTIFICATIONS_SEND), broadcastController.broadcastEmail);
router.get('/broadcast/email/logs', broadcastController.getEmailLogs);
router.post('/broadcast/whatsapp', shadowPermission(PERMISSIONS.NOTIFICATIONS_SEND), broadcastController.broadcastWhatsapp);
router.get('/broadcast/whatsapp/logs', broadcastController.getWhatsappLogs);

// Notification Scheduler — queue a broadcast for a future time instead of sending now
router.use('/notifications/scheduled', requireModule('communication'));
router.get('/notifications/scheduled', notificationSchedulerController.getScheduled);
router.post('/notifications/scheduled', shadowPermission(PERMISSIONS.NOTIFICATIONS_SEND), notificationSchedulerController.createScheduled);
router.delete('/notifications/scheduled/:id', shadowPermission(PERMISSIONS.NOTIFICATIONS_SEND), notificationSchedulerController.cancelScheduled);

// Message Template Library (SMS / Email / WhatsApp)
router.use('/templates', requireModule('communication'));
router.get('/templates', templateController.getTemplates);
router.post('/templates', templateController.createTemplate);
router.patch('/templates/:id', templateController.updateTemplate);
router.delete('/templates/:id', templateController.deleteTemplate);

// Campus Events & Clubs
router.use('/events', requireModule('events_clubs'));
router.get('/events', eventController.getEvents);
router.post('/events', eventController.createEvent);
router.delete('/events/:id', eventController.deleteEvent);

router.use('/clubs', requireModule('events_clubs'));
router.get('/clubs', clubController.getClubs);
router.post('/clubs', clubController.createClub);
router.delete('/clubs/:id', clubController.deleteClub);

// Student Grievances & Course Feedback
router.use('/grievances', requireModule('grievance_feedback'));
router.get('/grievances', shadowPermission(PERMISSIONS.GRIEVANCES_RESOLVE), grievanceController.getGrievances);
router.patch('/grievances/:id', shadowPermission(PERMISSIONS.GRIEVANCES_RESOLVE), grievanceController.updateGrievance);

router.get('/feedback/summary', requireModule('grievance_feedback'), feedbackController.getFeedbackSummary);

// Front Office — Admission Enquiries
router.use('/enquiries', requireModule('front_office'));
router.get('/enquiries', enquiryController.getEnquiries);
router.post('/enquiries', enquiryController.createEnquiry);
router.patch('/enquiries/:id', enquiryController.updateEnquiry);
router.delete('/enquiries/:id', enquiryController.deleteEnquiry);

// Pre-Admission Applications (public form submissions + manual entries)
router.use('/pre-admission', requireModule('pre_admission'));
router.get('/pre-admission/applications', preAdmissionController.getApplications);
router.post('/pre-admission/applications', preAdmissionController.createApplication);
router.get('/pre-admission/applications/:id', preAdmissionController.getApplicationById);
router.patch('/pre-admission/applications/:id/status', preAdmissionController.updateStatus);
router.post('/pre-admission/applications/:id/receipt', preAdmissionController.generateReceipt);
router.post('/pre-admission/applications/:id/admit', preAdmissionController.admitApplication);
router.delete('/pre-admission/applications/:id', preAdmissionController.deleteApplication);
router.get('/pre-admission/settings/api-key', preAdmissionController.getApiKeySettings);
router.post('/pre-admission/settings/api-key/regenerate', preAdmissionController.regenerateApiKey);
router.patch('/pre-admission/settings/fee', preAdmissionController.updateFeeAmount);

// Admission Form Custom Fields (institution-defined extra fields, SuperAdmin-approved)
// Generalized custom-field system — entityType query/body param picks which form
// (ADMISSION, STAFF_PROFILE, ...) a request applies to; defaults to ADMISSION.
router.get('/custom-fields', admissionCustomFieldController.getFields);
router.get('/custom-fields/approved', admissionCustomFieldController.getApprovedFields);
router.post('/custom-fields', admissionCustomFieldController.createField);
router.patch('/custom-fields/:id', admissionCustomFieldController.updateField);
router.delete('/custom-fields/:id', admissionCustomFieldController.deleteField);
router.post('/custom-fields/submit', admissionCustomFieldController.submitForApproval);

// Institution Custom Lists (Leave Types, Discipline Categories, Exam Types) — self-service,
// no SuperAdmin approval; listType passed as a query/body param.
router.get('/custom-lists', institutionCustomListController.getList);
router.get('/custom-lists/active', institutionCustomListController.getActiveEntries);
router.post('/custom-lists', institutionCustomListController.createEntry);
router.patch('/custom-lists/:id', institutionCustomListController.updateEntry);
router.delete('/custom-lists/:id', institutionCustomListController.deleteEntry);

// Payroll
router.use('/payroll', requireModule('payroll'));
router.get('/payroll', payrollController.getPayslips);
router.post('/payroll', payrollController.generatePayslip);
router.patch('/payroll/:id/pay', payrollController.markPayslipPaid);
router.delete('/payroll/:id', payrollController.deletePayslip);

// Student Discipline
router.use('/discipline', requireModule('discipline'));
router.get('/discipline', disciplineController.getDisciplineRecords);
router.post('/discipline', disciplineController.createDisciplineRecord);
router.patch('/discipline/:id', disciplineController.updateDisciplineRecord);
router.delete('/discipline/:id', disciplineController.deleteDisciplineRecord);

// Student Health Records
router.use('/health-records', requireModule('health'));
router.get('/health-records', healthController.getHealthRecords);
router.post('/health-records', healthController.createHealthRecord);
router.patch('/health-records/:id', healthController.updateHealthRecord);
router.delete('/health-records/:id', healthController.deleteHealthRecord);

// Visitor / Gate Management
router.use('/visitors', requireModule('visitor_management'));
router.get('/visitors', visitorController.getVisitorLogs);
router.post('/visitors', visitorController.createVisitorLog);
router.patch('/visitors/:id/checkout', visitorController.checkOutVisitor);

// Photo Gallery
router.use('/gallery', requireModule('gallery'));
router.get('/gallery/albums', galleryController.getAlbums);
router.post('/gallery/albums', galleryController.createAlbum);
router.delete('/gallery/albums/:id', galleryController.deleteAlbum);
router.get('/gallery/albums/:id/photos', galleryController.getAlbumPhotos);
router.post('/gallery/albums/:id/photos', galleryController.addPhoto);
router.delete('/gallery/photos/:photoId', galleryController.deletePhoto);

// Placement Cell — Internships & Placements
router.use('/postings', requireModule('placement'));
router.get('/postings', shadowPermission(PERMISSIONS.PLACEMENT_MANAGE), jobPostingController.getPostings);
router.post('/postings', shadowPermission(PERMISSIONS.PLACEMENT_MANAGE), jobPostingController.createPosting);
router.patch('/postings/:id/close', shadowPermission(PERMISSIONS.PLACEMENT_MANAGE), jobPostingController.closePosting);
router.get('/postings/:id/applications', shadowPermission(PERMISSIONS.PLACEMENT_MANAGE), jobPostingController.getApplications);
router.patch('/postings/applications/:id', shadowPermission(PERMISSIONS.PLACEMENT_MANAGE), jobPostingController.updateApplicationStatus);

// Research & Publications (institution-wide oversight — authoring happens on the Staff side)
router.get('/research', requireModule('research'), researchController.getInstitutionResearch);

// Alumni Network
router.use('/alumni', requireModule('alumni'));
router.get('/alumni', alumniController.getAlumni);
router.get('/alumni/eligible-students', alumniController.getEligibleStudents);
router.post('/alumni', alumniController.createAlumni);
router.patch('/alumni/:id', alumniController.updateAlumni);
router.delete('/alumni/:id', alumniController.deleteAlumni);

// Convocation & Degree Issuance
router.use('/degrees', requireModule('convocation'));
router.get('/degrees', degreeController.getDegrees);
router.post('/degrees', degreeController.createDegree);
router.patch('/degrees/:id/issue', degreeController.issueDegree);
router.patch('/degrees/:id/revoke', degreeController.revokeDegree);
router.delete('/degrees/:id', degreeController.deleteDegree);

// University Affiliation Oversight (real only for a UNIVERSITY-type institution)
router.get('/affiliated-colleges', affiliationController.getAffiliatedColleges);

// AI Study Tutor — Textbook Content Management
router.use('/textbooks', requireModule('ai_tutor'));
router.get('/textbooks', textbookController.getTextbooks);
router.post('/textbooks', textbookController.createTextbook);
router.patch('/textbooks/:id', textbookController.updateTextbook);
router.delete('/textbooks/:id', textbookController.deleteTextbook);

// Attendance Oversight
router.use('/attendance', requireModule('attendance'));
router.get('/attendance/register', shadowPermission(PERMISSIONS.ATTENDANCE_VIEW), attendanceController.getDailyRegister);
router.get('/attendance/absentees', shadowPermission(PERMISSIONS.ATTENDANCE_VIEW), attendanceController.getAbsentees);
router.post('/attendance/absentees/notify', shadowPermission(PERMISSIONS.NOTIFICATIONS_SEND), attendanceController.notifyAbsentees);
router.get('/attendance/consolidated-report', shadowPermission(PERMISSIONS.ATTENDANCE_VIEW), attendanceController.getConsolidatedAttendanceReport);
router.get('/attendance/date-wise-report', shadowPermission(PERMISSIONS.ATTENDANCE_VIEW), attendanceController.getDateWiseAttendanceReport);

// Dynamic Report Builder (Phase 8) — registered before the /reports/:code/... wildcard
// block below so these specific literal paths always win, regardless of what report
// codes exist (the existing pre-built-report engine's :code wildcard would otherwise
// silently swallow a path like /reports/dynamic/preview as code="dynamic").
router.get('/reports/dynamic/sources', shadowPermission(PERMISSIONS.REPORTS_VIEW), dynamicReportController.getDataSources);
router.post('/reports/dynamic/preview', shadowPermission(PERMISSIONS.REPORTS_VIEW), dynamicReportController.previewReport);
router.post('/reports/dynamic/export', shadowPermission(PERMISSIONS.REPORTS_VIEW), dynamicReportController.exportReport);
router.get('/reports/dynamic/saved', shadowPermission(PERMISSIONS.REPORTS_VIEW), dynamicReportController.getSavedDefinitions);
router.post('/reports/dynamic/saved', shadowPermission(PERMISSIONS.REPORTS_VIEW), dynamicReportController.saveDefinition);
router.post('/reports/dynamic/saved/:id/run', shadowPermission(PERMISSIONS.REPORTS_VIEW), dynamicReportController.runSavedDefinition);
router.delete('/reports/dynamic/saved/:id', shadowPermission(PERMISSIONS.REPORTS_VIEW), dynamicReportController.deleteDefinition);

// Dynamic Report Center
router.get('/reports/catalog', shadowPermission(PERMISSIONS.REPORTS_VIEW), reportController.getCatalog);
router.get('/reports/history', shadowPermission(PERMISSIONS.REPORTS_VIEW), reportController.getHistory);
router.get('/reports/saved', shadowPermission(PERMISSIONS.REPORTS_VIEW), reportController.getSavedReports);
router.post('/reports/saved', shadowPermission(PERMISSIONS.REPORTS_VIEW), reportController.createSavedReport);
router.delete('/reports/saved/:id', shadowPermission(PERMISSIONS.REPORTS_VIEW), reportController.deleteSavedReport);
router.get('/reports/filter-options', shadowPermission(PERMISSIONS.REPORTS_VIEW), reportController.getFilterOptions);
router.get('/reports/:code/definition', shadowPermission(PERMISSIONS.REPORTS_VIEW), reportController.getDefinition);
router.post('/reports/:code/preview', shadowPermission(PERMISSIONS.REPORTS_VIEW), reportController.previewReport);
router.post('/reports/:code/generate', shadowPermission(PERMISSIONS.REPORTS_VIEW), reportController.generateReport);
router.post('/reports/:code/export', shadowPermission(PERMISSIONS.REPORTS_VIEW), reportController.exportReport);

// Institution-specific report requests
router.post('/report-requests', shadowPermission(PERMISSIONS.REPORTS_VIEW), reportController.createReportRequest);
router.get('/report-requests', shadowPermission(PERMISSIONS.REPORTS_VIEW), reportController.getReportRequests);
router.get('/attendance/reports', shadowPermission(PERMISSIONS.ATTENDANCE_VIEW), attendanceController.getReports);

// Timetable
router.use('/timetable', requireModule('timetable'));
router.get('/timetable', shadowPermission(PERMISSIONS.TIMETABLE_VIEW), timetableController.getTimetable);
router.put('/timetable/:timetableId/entries', shadowPermission(PERMISSIONS.TIMETABLE_MANAGE), timetableController.saveEntries);
router.get('/timetable/teacher/:staffId', shadowPermission(PERMISSIONS.TIMETABLE_VIEW), timetableController.getTeacherTimetable);

// Examination
router.use('/exams', requireModule('examination'));
router.use('/exam-schedules', requireModule('examination'));
router.get('/exams', shadowPermission(PERMISSIONS.EXAMS_VIEW), examController.getExams);
router.post('/exams', shadowPermission(PERMISSIONS.EXAMS_CREATE), examController.createExam);
router.patch('/exams/:id/status', shadowPermission(PERMISSIONS.EXAMS_CREATE), examController.updateExamStatus);
router.get('/exams/:examId/rank-list', shadowPermission(PERMISSIONS.RESULTS_VIEW), examController.getRankList);
router.get('/exams/:examId/consolidated-report', shadowPermission(PERMISSIONS.RESULTS_VIEW), examController.getConsolidatedMarksReport);
router.get('/students/:studentId/marksheet', requireModule('examination'), shadowPermission(PERMISSIONS.RESULTS_VIEW), examController.getStudentMarksheet);

// Grade Scale (SGPA/CGPA point system)
router.use('/grade-scale', requireModule('examination'));
router.get('/grade-scale', gradeScaleController.getGradeScale);
router.post('/grade-scale/seed-default', gradeScaleController.seedDefaultScale);
router.post('/grade-scale', gradeScaleController.createGrade);
router.patch('/grade-scale/:id', gradeScaleController.updateGrade);
router.delete('/grade-scale/:id', gradeScaleController.deleteGrade);

router.get('/exam-schedules', shadowPermission(PERMISSIONS.EXAMS_VIEW), examController.getSchedules);
router.post('/exam-schedules', shadowPermission(PERMISSIONS.EXAMS_CREATE), examController.createSchedule);
router.delete('/exam-schedules/:id', shadowPermission(PERMISSIONS.EXAMS_CREATE), examController.deleteSchedule);
router.get('/exam-schedules/:scheduleId/marks', shadowPermission(PERMISSIONS.MARKS_ENTER), examController.getMarksRoster);
router.post('/exam-schedules/:scheduleId/marks', shadowPermission(PERMISSIONS.MARKS_ENTER), examController.saveMarks);
router.post('/exam-schedules/:scheduleId/publish', shadowPermission(PERMISSIONS.RESULTS_PUBLISH), examController.publishResults);
router.post('/exam-schedules/:scheduleId/unlock', shadowPermission(PERMISSIONS.RESULTS_PUBLISH), examController.unlockSchedule);
router.post('/exam-schedules/:scheduleId/import', upload.single('file'), shadowPermission(PERMISSIONS.MARKS_ENTER), examController.parseMarksImport);

module.exports = router;
