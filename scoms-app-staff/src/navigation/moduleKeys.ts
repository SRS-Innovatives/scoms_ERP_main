/**
 * Staff App module keys this app has screens for. Must exist in shared/appModules/catalog.js
 * (STAFF_APP_MODULES); test/staffAppModules.test.js and __tests__/moduleLayout.test.ts check
 * this. Kept free of screen imports so services/api/appModules.ts can use it without a cycle.
 */
export const MODULE_KEYS = {
  attendance: 'attendance',
  homework: 'homework',
  examination: 'examination',
  library: 'library',
  transport: 'transport',
  hostel: 'hostel',
  exam_setup: 'exam_setup',
  placement: 'placement',
  timetable: 'timetable',
  leave: 'leave',
  student_leave: 'student_leave',
  announcements: 'announcements',
  academic_calendar: 'academic_calendar',
  ptm: 'ptm',
  materials: 'materials',
  exam_duties: 'exam_duties',
  messages: 'messages',
} as const;

export type ModuleKey = (typeof MODULE_KEYS)[keyof typeof MODULE_KEYS];

/**
 * Fallback only (gateway without /app-modules, or it failed): the institution module each
 * app module depends on, checked against /auth/me's institution.enabledModules. null = always.
 */
export const LEGACY_REQUIRES: Record<ModuleKey, string | null> = {
  attendance: 'attendance',
  homework: 'homework',
  examination: 'examination',
  library: 'library',
  transport: 'transport',
  hostel: 'hostel',
  exam_setup: 'examination',
  placement: 'placement',
  timetable: 'timetable',
  leave: null,
  student_leave: null,
  announcements: 'communication',
  academic_calendar: 'academic_calendar',
  ptm: 'ptm',
  materials: null,
  exam_duties: 'examination',
  messages: 'messaging',
};

export const ROLES = {
  TEACHER: 'TEACHER',
  HOD: 'HOD',
  PRINCIPAL: 'PRINCIPAL',
  VICE_PRINCIPAL: 'VICE_PRINCIPAL',
  STAFF: 'STAFF',
  ACCOUNTANT: 'ACCOUNTANT',
  LIBRARIAN: 'LIBRARIAN',
  TRANSPORT_MANAGER: 'TRANSPORT_MANAGER',
  HOSTEL_WARDEN: 'HOSTEL_WARDEN',
  EXAM_ADMIN: 'EXAM_ADMIN',
  PLACEMENT_OFFICER: 'PLACEMENT_OFFICER',
} as const;

export const ALL_STAFF_ROLES: string[] = Object.values(ROLES);
