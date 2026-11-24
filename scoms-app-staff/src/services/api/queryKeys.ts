/**
 * Shared react-query keys. The dashboard is one summary request (GET /dashboard/summary);
 * screens whose actions change a dashboard number invalidate `dashboardAll` as well as
 * their own key, so the home screen is never stale after an action.
 */
export const queryKeys = {
  appModules: ['appModules'] as const,
  dashboardSummary: ['dashboard', 'summary'] as const,
  dashboardAll: ['dashboard'] as const,
  homeworkAll: ['staff', 'assignments'] as const,
  leavesAll: ['staff', 'leaves'] as const,
  notificationsAll: ['staff', 'notifications'] as const,
  studentLeave: ['staff', 'studentLeave'] as const,
  corrections: ['staff', 'attendanceCorrections'] as const,
  announcements: ['communication', 'announcements'] as const,
  circulars: ['communication', 'circulars'] as const,
  academicCalendar: ['academicCalendar'] as const,
  ptm: ['staff', 'ptm'] as const,
  materials: ['staff', 'materials'] as const,
  examDuties: ['staff', 'examDuties'] as const,
  messages: ['staff', 'messages'] as const,
};
