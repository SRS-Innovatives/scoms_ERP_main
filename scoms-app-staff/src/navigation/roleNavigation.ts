import { MainTabParamList } from './types';
import { EnabledModule } from '../types/auth';

export type StaffTabKey = keyof MainTabParamList;

/**
 * Which tabs each staff role sees. Home and More are the universal baseline —
 * every role gets a dashboard and a way to reach Leave/Notifications/Profile.
 * A role not listed here falls back to DEFAULT_TABS until its own module screen
 * exists; showing a tab with no real backing screen would just 404/403 for that role.
 *
 * This list is cross-checked against shared/permissions/permissionMatrix.js AND the
 * actual query scope of the routes each screen calls — not guessed from job title:
 *  - Principal/Vice Principal have EXAMS_VIEW + RESULTS_PUBLISH, but the only mobile
 *    endpoint that lists exams (/exams/my-schedules) scopes strictly to
 *    SubjectTeacherMapping (i.e. "subjects THIS staff member teaches") — a role with
 *    no teaching assignment always gets an empty list back, permission or not. They
 *    also lack ATTENDANCE_MARK/ASSIGNMENTS_VIEW/MARKS_ENTER outright. No tab here
 *    would show them anything real yet, so they fall through to DEFAULT_TABS.
 *  - Staff (generic, non-teaching) has none of attendance/homework/exam permissions
 *    at all, so it also falls through to DEFAULT_TABS.
 */
const ROLE_TABS: Record<string, StaffTabKey[]> = {
  TEACHER: ['Home', 'Attendance', 'Homework', 'Examination', 'More'],
  HOD: ['Home', 'Attendance', 'Homework', 'Examination', 'More'],
  LIBRARIAN: ['Home', 'Library', 'More'],
  TRANSPORT_MANAGER: ['Home', 'Transport', 'More'],
  ACCOUNTANT: ['Home', 'FeeDesk', 'More'],
  HOSTEL_WARDEN: ['Home', 'Hostel', 'More'],
  EXAM_ADMIN: ['Home', 'ExamSetup', 'More'],
  PLACEMENT_OFFICER: ['Home', 'Placement', 'More'],
};

const DEFAULT_TABS: StaffTabKey[] = ['Home', 'More'];

/** Maps a tab to the optional-module key requireModule() gates it behind on the
 * backend — Home/More have no module key, so they're never filtered out here. */
const MODULE_FOR_TAB: Partial<Record<StaffTabKey, string>> = {
  Attendance: 'attendance',
  Homework: 'homework',
  Examination: 'examination',
  Library: 'library',
  Transport: 'transport',
  FeeDesk: 'fee',
  Hostel: 'hostel',
  ExamSetup: 'examination',
  Placement: 'placement',
};

function isModuleEnabled(enabledModules: EnabledModule[] | string[] | undefined, moduleKey: string): boolean {
  if (!enabledModules) return true; // legacy institutions with no explicit list default to visible
  return enabledModules.some((m) => (typeof m === 'string' ? m === moduleKey : m.key === moduleKey && m.enabled));
}

/**
 * Dynamic frontend tab visibility is NOT security — every one of these routes is
 * independently re-checked by requireModule()/shadowPermission() on the backend
 * regardless of what tabs this returns.
 */
export function resolveStaffTabs(
  role: string | undefined,
  enabledModules: EnabledModule[] | string[] | undefined,
): StaffTabKey[] {
  const base = (role && ROLE_TABS[role]) || DEFAULT_TABS;
  return base.filter((tab) => {
    const moduleKey = MODULE_FOR_TAB[tab];
    return !moduleKey || isModuleEnabled(enabledModules, moduleKey);
  });
}
