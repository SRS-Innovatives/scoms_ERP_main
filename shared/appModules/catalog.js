/**
 * Mobile App Module Catalog — what Super Admin can show/hide per institution, per app,
 * per role (Super Admin → Institutions → App Module Access).
 *
 * Each entry:
 *   key       app-module key (what the app's navigation registry and the DB rows use)
 *   label     shown in Super Admin and as the default menu label in the app
 *   group     section heading in the Super Admin page
 *   requires  the institution module (shared/constants/institutionModules.js) it depends
 *             on, or null for a feature every institution has. If the institution doesn't
 *             have that module, the app module is off regardless of this setting.
 *   roles     roles the module makes sense for. A role not listed can't see it and the
 *             Super Admin toggle for it is disabled (e.g. a parent can't build the child's
 *             resume or apply to placements).
 *   defaultHiddenFor  setting columns that start with the module HIDDEN until Super Admin
 *             turns it on. Without it a module starts visible.
 *   defaultHidden  true = starts hidden for every column (e.g. staff messaging).
 *   routes    API path prefixes (relative to the app's gateway prefix, e.g.
 *             /api/v1/mobile/student) that belong to this module. requireAppModule()
 *             blocks them when the module is hidden for the caller. Longest prefix wins,
 *             so /profile/id-card can belong to id_card while /profile stays core.
 *
 * Paths not claimed by any entry (auth, profile, notifications, settings, parent/children)
 * are CORE — always available, never hideable — because the app can't run without them.
 */
const { ROLES } = require('../constants/roles');

const S = ROLES.STUDENT;
const P = ROLES.PARENT;

const STUDENT_APP_MODULES = [
  // Academics
  { key: 'attendance', label: 'Attendance', group: 'Academics', requires: 'attendance', roles: [S, P], routes: ['/attendance'] },
  { key: 'timetable', label: 'Timetable', group: 'Academics', requires: 'timetable', roles: [S, P], routes: ['/timetable'] },
  { key: 'homework', label: 'Homework', group: 'Academics', requires: 'homework', roles: [S, P], routes: ['/assignments'] },
  { key: 'subjects', label: 'My Subjects', group: 'Academics', requires: null, roles: [S, P], routes: ['/subjects'] },
  { key: 'materials', label: 'Study Materials', group: 'Academics', requires: null, roles: [S, P], routes: ['/materials'] },
  { key: 'academic_calendar', label: 'Academic Calendar', group: 'Academics', requires: 'academic_calendar', roles: [S, P], routes: ['/academic-calendar'] },
  { key: 'leave', label: 'Leave Requests', group: 'Academics', requires: null, roles: [S, P], routes: ['/leave'] },

  // Examinations
  { key: 'examination', label: 'Exams, Results & Hall Ticket', group: 'Examinations', requires: 'examination', roles: [S, P], routes: ['/exams'] },
  { key: 'question_bank', label: 'Question Bank & Practice Tests', group: 'Examinations', requires: 'examination', roles: [S], routes: ['/question-bank'] },
  { key: 'ai_tutor', label: 'AI Study Tutor', group: 'Examinations', requires: 'ai_tutor', roles: [S], routes: ['/ai'] },

  // Fees
  // openRoutes: never blocked even when hidden — a payment already started must still be able to complete
  { key: 'fees', label: 'Fees & Online Payment', group: 'Fees', requires: 'fee', roles: [S, P], routes: ['/fees'], openRoutes: ['/fees/pay/verify'] },

  // Communication
  { key: 'announcements', label: 'Announcements & Circulars', group: 'Communication', requires: 'communication', roles: [S, P], routes: ['/announcements', '/circulars'] },
  { key: 'messages', label: 'Messages (chat with teachers)', group: 'Communication', requires: 'messaging', roles: [S, P], routes: ['/messages'] },
  { key: 'gallery', label: 'Photo Gallery', group: 'Communication', requires: 'gallery', roles: [S, P], routes: ['/gallery'] },

  // Campus life
  { key: 'transport', label: 'Transport', group: 'Campus', requires: 'transport', roles: [S, P], routes: ['/transport'] },
  { key: 'hostel', label: 'Hostel', group: 'Campus', requires: 'hostel', roles: [S, P], routes: ['/hostel'] },
  { key: 'library', label: 'Library', group: 'Campus', requires: 'library', roles: [S, P], routes: ['/library'] },
  { key: 'events_clubs', label: 'Events & Clubs', group: 'Campus', requires: 'events_clubs', roles: [S, P], routes: ['/events', '/clubs'] },
  { key: 'house', label: 'My House', group: 'Campus', requires: null, roles: [S, P], routes: ['/house'] },

  // Services & documents
  { key: 'certificates', label: 'Certificates', group: 'Services', requires: 'certificates', roles: [S, P], routes: ['/certificates', '/certificate-requests', '/certificate-types'] },
  { key: 'documents', label: 'My Documents', group: 'Services', requires: null, roles: [S, P], routes: ['/documents'] },
  { key: 'id_card', label: 'Digital ID Card', group: 'Services', requires: null, roles: [S, P], routes: ['/profile/id-card'] },
  { key: 'grievance_feedback', label: 'Grievance & Feedback', group: 'Services', requires: 'grievance_feedback', roles: [S, P], routes: ['/grievances', '/feedback'] },
  { key: 'appointments', label: 'Counselling Appointments', group: 'Services', requires: 'counselling', roles: [S, P], routes: ['/appointments'] },
  { key: 'degrees', label: 'Degree / Convocation', group: 'Services', requires: 'convocation', roles: [S, P], routes: ['/degrees'] },

  // Parent corner — records the school shares with the family only
  { key: 'discipline', label: 'Discipline Records', group: 'Parent Corner', requires: 'discipline', roles: [P], routes: ['/discipline'] },
  { key: 'health', label: 'Health & Sick-room Visits', group: 'Parent Corner', requires: 'health', roles: [P], routes: ['/health-records'] },
  { key: 'ptm', label: 'Parent-Teacher Meeting Notes', group: 'Parent Corner', requires: 'ptm', roles: [P], routes: ['/ptm-notes'] },

  // Career
  { key: 'placements', label: 'Placements & Internships', group: 'Career', requires: 'placement', roles: [S], routes: ['/postings'] },
  { key: 'career_portfolio', label: 'Resume & Achievements', group: 'Career', requires: 'career_portfolio', roles: [S], routes: ['/resume', '/achievements'] },
];

/*
 * Staff App. `roles` here follow shared/permissions/permissionMatrix.js — a module is listed
 * for a role only when that role holds the permission its API checks (e.g. PTM notes need
 * ptm.manage). Super Admin sets ONE
 * toggle per module for the whole staff app (column ALL_STAFF); the role list then decides
 * who inside the staff actually gets it.
 *
 * Not in the catalog on purpose: /fee-desk — closed for every staff role in
 * Staff_backend/src/routes/apiRoutes.js (fees are handled by the Institute Admin only).
 */
const T = ROLES.TEACHER;
const H = ROLES.HOD;
const PR = ROLES.PRINCIPAL;
const VP = ROLES.VICE_PRINCIPAL;
const ST = ROLES.STAFF;
const AC = ROLES.ACCOUNTANT;
const LB = ROLES.LIBRARIAN;
const TM = ROLES.TRANSPORT_MANAGER;
const HW = ROLES.HOSTEL_WARDEN;
const EA = ROLES.EXAM_ADMIN;
const PO = ROLES.PLACEMENT_OFFICER;
const STAFF_ROLES = [T, H, PR, VP, ST, AC, LB, TM, HW, EA, PO];
const ALL_STAFF = 'ALL_STAFF'; // the single Super Admin setting column for the staff app
const LEADERS = [PR, VP];

const STAFF_APP_MODULES = [
  // Teaching
  { key: 'timetable', label: 'Timetable & Substitutions', group: 'Teaching', requires: 'timetable', roles: STAFF_ROLES, routes: ['/timetable'] },
  { key: 'attendance', label: 'Student Attendance & Corrections', group: 'Teaching', requires: 'attendance', roles: [T, H, ...LEADERS], routes: ['/attendance', '/attendance-corrections'] },
  { key: 'homework', label: 'Homework & Evaluation', group: 'Teaching', requires: 'homework', roles: [T, H], routes: ['/assignments'] },
  { key: 'materials', label: 'Study Materials', group: 'Teaching', requires: null, roles: [T, H, ST], routes: ['/materials'] },
  { key: 'student_leave', label: 'Student Leave Approvals', group: 'Teaching', requires: null, roles: [T, H, ...LEADERS], routes: ['/student-leave'] },
  { key: 'scholarship_approvals', label: 'Scholarship Approvals', group: 'Teaching', requires: 'fee', roles: [T, H], routes: ['/scholarship-approvals'] },

  // Examinations
  { key: 'examination', label: 'Marks Entry, Review & Results', group: 'Examinations', requires: 'examination', roles: [T, H, ...LEADERS, EA], routes: ['/exams', '/exam-schedules'] },
  { key: 'question_bank', label: 'Question Bank & Paper Generator', group: 'Examinations', requires: 'examination', roles: [T, H, EA], routes: ['/questions'] },
  { key: 'exam_duties', label: 'My Exam Duties', group: 'Examinations', requires: 'examination', roles: STAFF_ROLES, routes: ['/exam-duties'] },
  { key: 'exam_setup', label: 'Exam Setup (create & schedule)', group: 'Examinations', requires: 'examination', roles: [EA], routes: ['/exam-setup'] },

  // Communication
  { key: 'announcements', label: 'Announcements & Circulars', group: 'Communication', requires: 'communication', roles: STAFF_ROLES, routes: ['/announcements', '/circulars'] },
  { key: 'academic_calendar', label: 'Academic Calendar', group: 'Communication', requires: 'academic_calendar', roles: STAFF_ROLES, routes: ['/academic-calendar'] },
  { key: 'messages', label: 'Messages (chat with students)', group: 'Communication', requires: 'messaging', roles: [T, H, ...LEADERS, ST], defaultHidden: true, routes: ['/messages'] },
  { key: 'sms', label: 'SMS to Parents', group: 'Communication', requires: null, roles: [T, H, ...LEADERS], defaultHidden: true, routes: ['/sms'] },
  { key: 'ptm', label: 'Parent-Teacher Meeting Notes', group: 'Communication', requires: 'ptm', roles: [T, H, ...LEADERS], routes: ['/parent-meetings'] },
  { key: 'gallery', label: 'Photo Gallery', group: 'Communication', requires: 'gallery', roles: [T, H, ...LEADERS], routes: ['/gallery'] },

  // Student life
  { key: 'events_clubs', label: 'Events & Clubs', group: 'Student Life', requires: 'events_clubs', roles: STAFF_ROLES, routes: ['/events', '/clubs'] },
  { key: 'achievements', label: 'Student Achievements', group: 'Student Life', requires: 'career_portfolio', roles: [T, H], routes: ['/achievements'] },
  { key: 'appointments', label: 'Counselling Appointments', group: 'Student Life', requires: 'counselling', roles: [H, ...LEADERS], routes: ['/appointments'] },

  // Role desks
  { key: 'library', label: 'Library Desk', group: 'Desks', requires: 'library', roles: [LB], routes: ['/library'] },
  { key: 'transport', label: 'Transport Desk', group: 'Desks', requires: 'transport', roles: [TM], routes: ['/transport'] },
  { key: 'hostel', label: 'Hostel Desk', group: 'Desks', requires: 'hostel', roles: [HW], routes: ['/hostel'] },
  { key: 'placement', label: 'Placement Cell', group: 'Desks', requires: 'placement', roles: [PO], routes: ['/postings'] },
  { key: 'lab', label: 'Lab Equipment', group: 'Desks', requires: 'inventory', roles: [T, H], routes: ['/lab'] },
  { key: 'expenses', label: 'Expense Logging', group: 'Desks', requires: 'expense_management', roles: [AC], routes: ['/expenses'] },
  { key: 'research', label: 'Research & Publications', group: 'Desks', requires: 'research', roles: [T, H], routes: ['/research'] },

  // My work
  { key: 'leave', label: 'My Leave', group: 'My Work', requires: null, roles: STAFF_ROLES, routes: ['/leave'] },
  { key: 'my_attendance', label: 'My Attendance', group: 'My Work', requires: 'attendance', roles: STAFF_ROLES, routes: ['/attendance/self'] },
];

/*
 * columns = the Super Admin setting columns. A stored InstitutionAppModuleSetting.role is a
 * column key. The student app has one column per role; the staff app has one for everyone.
 */
const APPS = {
  STUDENT_APP: {
    key: 'STUDENT_APP',
    label: 'Student / Parent App',
    roles: [S, P],
    columns: [
      { key: S, label: 'Student', roles: [S] },
      { key: P, label: 'Parent', roles: [P] },
    ],
    gatewayPrefix: '/api/v1/mobile/student',
    modules: STUDENT_APP_MODULES,
  },
  STAFF_APP: {
    key: 'STAFF_APP',
    label: 'Staff App',
    roles: STAFF_ROLES,
    columns: [{ key: ALL_STAFF, label: 'All staff', roles: STAFF_ROLES }],
    gatewayPrefix: '/api/v1/mobile/staff',
    modules: STAFF_APP_MODULES,
  },
};

const APP_KEYS = Object.keys(APPS);

const getApp = (appKey) => APPS[appKey] || null;

/** The catalog module that owns this request path (longest matching prefix), or null = core. */
const findModuleForPath = (appKey, path) => {
  const app = getApp(appKey);
  if (!app) return null;
  let best = null;
  let bestLen = -1;
  for (const mod of app.modules) {
    if ((mod.openRoutes || []).includes(path)) return null;
    for (const prefix of mod.routes) {
      const matches = path === prefix || path.startsWith(`${prefix}/`);
      if (matches && prefix.length > bestLen) {
        best = mod;
        bestLen = prefix.length;
      }
    }
  }
  return best;
};

/** The Super Admin setting column a role falls under in this app, or null. */
const columnForRole = (app, role) => app.columns.find((c) => c.roles.includes(role)) || null;

/** Whether a module applies to anyone in a setting column (drives the toggle's enabled state). */
const isApplicableToColumn = (mod, column) => mod.roles.some((r) => column.roles.includes(r));

/** Whether a module starts visible for a setting column when Super Admin hasn't set anything.
 * `defaultHidden` = hidden for every column; `defaultHiddenFor` = hidden for those columns. */
const isDefaultVisible = (mod, columnKey) => !mod.defaultHidden && !(mod.defaultHiddenFor || []).includes(columnKey);

module.exports = {
  APPS, APP_KEYS, STAFF_ROLES, ALL_STAFF, getApp, findModuleForPath, columnForRole, isApplicableToColumn, isDefaultVisible,
};
