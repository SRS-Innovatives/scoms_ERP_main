/**
 * Every react-query key in the app, in one place.
 *
 * Why: the dashboard and the module screens used to cache the same data under different
 * keys (['dashboard','attendance'] vs ['attendance','summary'], …) — so the same request
 * ran twice, and a change made on one screen (submitting homework, paying a fee) left the
 * other one stale. Screens that show the same data now share a key, and mutations
 * invalidate through these helpers.
 *
 * The first segment is what ParentContext's child switch keeps or drops — see
 * CHILD_INDEPENDENT there (appModules, parentChildren, parentProfile survive a switch).
 */
export const queryKeys = {
  appModules: (userId?: string) => ['appModules', userId] as const,
  parentChildren: (userId?: string) => ['parentChildren', userId] as const,
  parentProfile: ['parentProfile'] as const,

  dashboardSummary: (sections: string) => ['dashboard', 'summary', sections] as const,
  dashboardAll: ['dashboard'] as const,

  attendance: ['attendance', 'summary'] as const,
  timetable: ['timetable'] as const,
  homework: ['assignments'] as const,
  examSchedule: ['exams', 'schedule'] as const,
  examResults: ['exams', 'results'] as const,
  fees: ['fees', 'overview'] as const,
  feesAll: ['fees'] as const,
  certificates: ['certificates'] as const,
  notifications: ['notifications', 'list'] as const,
  notificationsAll: ['notifications'] as const,

  discipline: ['parent', 'discipline'] as const,
  health: ['parent', 'health'] as const,
  ptm: ['parent', 'ptm'] as const,

  leave: ['leave', 'list'] as const,
  leaveTypes: ['leave', 'types'] as const,
  leaveAll: ['leave'] as const,
  announcements: ['communication', 'announcements'] as const,
  circulars: ['communication', 'circulars'] as const,
  academicCalendar: ['academicCalendar'] as const,
  materials: ['materials'] as const,
  gallery: ['gallery'] as const,
  transport: ['transport'] as const,
};
