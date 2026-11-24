/**
 * App-module keys this app has screens for. Must match shared/appModules/catalog.js
 * (STUDENT_APP). Kept free of screen imports so the AppModules store can use it without
 * an import cycle — the screen wiring lives in moduleRegistry.tsx.
 */
export const MODULE_KEYS = {
  attendance: 'attendance',
  timetable: 'timetable',
  homework: 'homework',
  examination: 'examination',
  fees: 'fees',
  certificates: 'certificates',
  leave: 'leave',
  announcements: 'announcements',
  academic_calendar: 'academic_calendar',
  materials: 'materials',
  gallery: 'gallery',
  transport: 'transport',
  discipline: 'discipline',
  health: 'health',
  ptm: 'ptm',
} as const;

export type ModuleKey = (typeof MODULE_KEYS)[keyof typeof MODULE_KEYS];

/**
 * Fallback only (gateway without /app-modules): the institution module each app module
 * depends on, checked against /auth/me's institution.enabledModules. null = always on.
 */
export const LEGACY_REQUIRES: Record<string, string | null> = {
  attendance: 'attendance',
  timetable: 'timetable',
  homework: 'homework',
  examination: 'examination',
  fees: 'fee',
  certificates: 'certificates',
  leave: null,
  announcements: 'communication',
  academic_calendar: 'academic_calendar',
  materials: null,
  gallery: 'gallery',
  transport: 'transport',
  discipline: 'discipline',
  health: 'health',
  ptm: 'ptm',
};

/** Fallback only: modules that exist for parents only (catalog roles: [PARENT]). */
export const PARENT_ONLY_KEYS: readonly string[] = ['discipline', 'health', 'ptm'];
