/**
 * System Roles and Permission Constants for SCOMS Platform
 */

const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  INSTITUTE_ADMIN: 'INSTITUTE_ADMIN',
  PRINCIPAL: 'PRINCIPAL',
  VICE_PRINCIPAL: 'VICE_PRINCIPAL',
  HOD: 'HOD',
  TEACHER: 'TEACHER',
  STAFF: 'STAFF',
  ACCOUNTANT: 'ACCOUNTANT',
  LIBRARIAN: 'LIBRARIAN',
  TRANSPORT_MANAGER: 'TRANSPORT_MANAGER',
  HOSTEL_WARDEN: 'HOSTEL_WARDEN',
  EXAM_ADMIN: 'EXAM_ADMIN',
  PLACEMENT_OFFICER: 'PLACEMENT_OFFICER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
};

const PERMISSIONS = {
  // Institutions & Platform
  INSTITUTIONS_VIEW: 'institutions.view',
  INSTITUTIONS_CREATE: 'institutions.create',
  INSTITUTIONS_UPDATE: 'institutions.update',
  INSTITUTIONS_DELETE: 'institutions.delete',
  INSTITUTIONS_MANAGE_MODULES: 'institutions.manage_modules',

  // Academic Structure
  ACADEMICS_VIEW: 'academics.view',
  ACADEMICS_MANAGE: 'academics.manage',

  // Users & Roles
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  // Students
  STUDENTS_VIEW: 'students.view',
  STUDENTS_CREATE: 'students.create',
  STUDENTS_UPDATE: 'students.update',
  STUDENTS_DELETE: 'students.delete',
  STUDENTS_PROMOTE: 'students.promote',

  // Staff
  STAFF_VIEW: 'staff.view',
  STAFF_CREATE: 'staff.create',
  STAFF_UPDATE: 'staff.update',
  STAFF_DELETE: 'staff.delete',

  // Attendance
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_MARK: 'attendance.mark',
  ATTENDANCE_UPDATE: 'attendance.update',
  ATTENDANCE_APPROVE: 'attendance.approve',

  // Leave Management
  LEAVE_APPLY: 'leave.apply',
  LEAVE_APPROVE: 'leave.approve',
  LEAVE_VIEW: 'leave.view',

  // Timetable
  TIMETABLE_VIEW: 'timetable.view',
  TIMETABLE_MANAGE: 'timetable.manage',

  // Assignments & Materials
  ASSIGNMENTS_VIEW: 'assignments.view',
  ASSIGNMENTS_CREATE: 'assignments.create',
  ASSIGNMENTS_SUBMIT: 'assignments.submit',
  ASSIGNMENTS_GRADE: 'assignments.grade',

  MATERIALS_VIEW: 'materials.view',
  MATERIALS_UPLOAD: 'materials.upload',

  // Exams & Marks
  EXAMS_VIEW: 'exams.view',
  EXAMS_CREATE: 'exams.create',
  MARKS_ENTER: 'marks.enter',
  MARKS_VERIFY: 'marks.verify',
  MARKS_APPROVE: 'marks.approve',
  RESULTS_PUBLISH: 'results.publish',
  RESULTS_VIEW: 'results.view',

  // Question Bank
  QUESTIONS_VIEW: 'questions.view',
  QUESTIONS_CREATE: 'questions.create',
  QUESTIONS_GENERATE_PAPER: 'questions.generate_paper',

  // Fees & Payments
  FEES_VIEW: 'fees.view',
  FEES_SETUP: 'fees.setup',
  FEES_COLLECT: 'fees.collect',
  FEES_REFUND: 'fees.refund',
  PAYMENTS_ONLINE: 'payments.online',

  // Campus Services
  LIBRARY_MANAGE: 'library.manage',
  TRANSPORT_MANAGE: 'transport.manage',
  HOSTEL_MANAGE: 'hostel.manage',
  CERTIFICATES_GENERATE: 'certificates.generate',

  // Communication & Services
  ANNOUNCEMENTS_CREATE: 'announcements.create',
  NOTIFICATIONS_SEND: 'notifications.send',
  GRIEVANCES_SUBMIT: 'grievances.submit',
  GRIEVANCES_RESOLVE: 'grievances.resolve',

  // AI & Analytics
  AI_ACCESS: 'ai.access',
  ANALYTICS_VIEW: 'analytics.view',
  REPORTS_VIEW: 'reports.view',
  AUDIT_LOGS_VIEW: 'audit_logs.view',

  // Placement Cell
  PLACEMENT_MANAGE: 'placement.manage',

  // Expense Management
  EXPENSES_VIEW: 'expenses.view',
  EXPENSES_CREATE: 'expenses.create',
  EXPENSES_APPROVE: 'expenses.approve',

  // Staff-portal feature areas previously unmapped (Phase 3 shadow-mode completion)
  LAB_MANAGE: 'lab.manage',
  APPOINTMENTS_MANAGE: 'appointments.manage',
  PTM_MANAGE: 'ptm.manage',
  ACHIEVEMENTS_MANAGE: 'achievements.manage',
  MESSAGING_ACCESS: 'messaging.access',
  RESEARCH_MANAGE: 'research.manage',
  GALLERY_MANAGE: 'gallery.manage',
  EVENTS_MANAGE: 'events.manage',

  // Platform-level (SuperAdmin/PlatformAdmin boundary — Phase 3 SuperAdmin RBAC wiring)
  REPORTS_MANAGE: 'reports.manage',
  USERS_MANAGE_ROLES: 'users.manage_roles',
  ADMISSION_FIELDS_REVIEW: 'admission_fields.review',
  BILLING_MANAGE: 'billing.manage',
  SUBSCRIPTIONS_MANAGE: 'subscriptions.manage',
  SUPPORT_MANAGE: 'support.manage',
  KNOWLEDGE_BASE_MANAGE: 'knowledge_base.manage',
  AI_CONFIG_MANAGE: 'ai_config.manage',
  PLATFORM_SETTINGS_MANAGE: 'platform_settings.manage',
  SECURITY_MANAGE: 'security.manage',
  INTEGRATIONS_MANAGE: 'integrations.manage',
  SMS_MANAGE: 'sms.manage',
  EMAIL_MANAGE: 'email.manage',
  WHATSAPP_MANAGE: 'whatsapp.manage',
  MODULE_REGISTRY_MANAGE: 'module_registry.manage',
};

module.exports = {
  ROLES,
  PERMISSIONS,
};
