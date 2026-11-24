/**
 * The one place that maps a Staff App module to its screen, label, icon and where it lives.
 * MainTabNavigator, MoreNavigator, the More menu and the dashboard's quick actions are all
 * built from this list — adding a module screen means adding one entry here.
 *
 * An entry shows when BOTH hold:
 *   1. useAppModules().isVisible(key): Super Admin's App Module Access + the institution's
 *      modules + the catalog's role list (shared/appModules/catalog.js STAFF_APP_MODULES);
 *   2. the signed-in role is in the entry's `roles`: the roles THIS screen actually serves
 *      today. The catalog can list more roles for a module than its current screen
 *      handles (e.g. Principal is in `attendance` for correction approvals, but the
 *      Attendance screen here is the teacher's marking screen), so this narrows it.
 *
 * Order = tab priority: the first MAX_MODULE_TABS visible tab-eligible entries become bottom
 * tabs (between Home and More); every other visible entry goes into More. Because each desk
 * screen is for one role only, this single order gives e.g.
 *   Teacher:   Home · Attendance · Homework · Exams · More   (Approvals, Timetable, ... in More)
 *   Librarian: Home · Library · Timetable · More
 *   Principal: Home · Leave Approvals · Corrections · More
 * A module key may back more than one screen (attendance = marking for teachers and
 * correction review for HOD / Principal / VP).
 */
import React from 'react';
import { AttendanceScreen } from '../modules/attendance/screens/AttendanceScreen';
import { HomeworkScreen } from '../modules/homework/screens/HomeworkScreen';
import { ExaminationScreen } from '../modules/examination/screens/ExaminationScreen';
import { LibraryScreen } from '../modules/library/screens/LibraryScreen';
import { TransportScreen } from '../modules/transport/screens/TransportScreen';
import { HostelScreen } from '../modules/hostel/screens/HostelScreen';
import { ExamSetupScreen } from '../modules/examSetup/screens/ExamSetupScreen';
import { PlacementScreen } from '../modules/placement/screens/PlacementScreen';
import { TimetableScreen } from '../modules/timetable/screens/TimetableScreen';
import { LeaveScreen } from '../modules/leave/screens/LeaveScreen';
import { StudentLeaveScreen } from '../modules/studentLeave/screens/StudentLeaveScreen';
import { AttendanceCorrectionsScreen } from '../modules/corrections/screens/AttendanceCorrectionsScreen';
import { NoticesScreen } from '../modules/communication/screens/NoticesScreen';
import { AcademicCalendarScreen } from '../modules/calendar/screens/AcademicCalendarScreen';
import { PtmNotesScreen } from '../modules/ptm/screens/PtmNotesScreen';
import { MaterialsScreen } from '../modules/materials/screens/MaterialsScreen';
import { ExamDutiesScreen } from '../modules/examDuties/screens/ExamDutiesScreen';
import { MessagesScreen } from '../modules/messages/screens/MessagesScreen';
import { ModuleUnavailableView } from '../components/ModuleUnavailableView';
import { useAppModules } from '../services/api/appModules';
import { useAuth } from '../store/AuthContext';
import { ALL_STAFF_ROLES, ModuleKey, ROLES } from './moduleKeys';
import { ModuleScreenName } from './types';

export const MAX_MODULE_TABS = 3;

export type MoreSection = 'teaching' | 'desk' | 'work' | 'communication';

export const SECTION_TITLES: Record<MoreSection, string> = {
  teaching: 'Teaching & Approvals',
  desk: 'My Desk',
  work: 'My Work',
  communication: 'Notices & Calendar',
};

export interface ModuleEntry {
  key: ModuleKey;
  screen: ModuleScreenName;
  label: string;
  icon: string; // MaterialIcons name
  tabEligible: boolean;
  /** Roles this screen serves today (see header). */
  roles: string[];
  section: MoreSection;
  /** moduleColors key for icons / tiles (defaults to the module key) */
  accent: string;
  component: React.ComponentType<any>;
}

/** Wraps a module screen so it renders the "not available" view if the module becomes
 * hidden while the screen is open. Created once per entry so component identity is
 * stable across renders (React Navigation requires that). */
function gated(key: ModuleKey, label: string, Screen: React.ComponentType<any>): React.ComponentType<any> {
  function GatedScreen(props: any) {
    const { isVisible } = useAppModules();
    if (!isVisible(key)) return <ModuleUnavailableView label={label} />;
    return <Screen {...props} />;
  }
  GatedScreen.displayName = `Gated(${label})`;
  return GatedScreen;
}

const { TEACHER, HOD, PRINCIPAL, VICE_PRINCIPAL, STAFF, LIBRARIAN, TRANSPORT_MANAGER, HOSTEL_WARDEN, EXAM_ADMIN, PLACEMENT_OFFICER } = ROLES;
const TEACHING = [TEACHER, HOD];
const LEADERS = [PRINCIPAL, VICE_PRINCIPAL];
// attendance.approve (checked strictly on the server): HOD, Principal, VP
const CORRECTION_REVIEWERS = [HOD, ...LEADERS];
// Principal / VP don't hold timetable.view (they approve substitutions — an S4 screen)
const OWN_TIMETABLE = ALL_STAFF_ROLES.filter((r) => r !== PRINCIPAL && r !== VICE_PRINCIPAL);

const entry = (
  key: ModuleKey,
  screen: ModuleScreenName,
  label: string,
  icon: string,
  tabEligible: boolean,
  roles: string[],
  section: MoreSection,
  Screen: React.ComponentType<any>,
  accent: string = key,
): ModuleEntry => ({ key, screen, label, icon, tabEligible, roles, section, accent, component: gated(key, label, Screen) });

export const MODULE_REGISTRY: ModuleEntry[] = [
  entry('attendance', 'Attendance', 'Attendance', 'how-to-reg', true, TEACHING, 'teaching', AttendanceScreen),
  entry('homework', 'Homework', 'Homework', 'menu-book', true, TEACHING, 'teaching', HomeworkScreen),
  entry('examination', 'Examination', 'Exams', 'edit-note', true, TEACHING, 'teaching', ExaminationScreen),
  entry('library', 'Library', 'Library', 'local-library', true, [LIBRARIAN], 'desk', LibraryScreen),
  entry('transport', 'Transport', 'Transport', 'directions-bus', true, [TRANSPORT_MANAGER], 'desk', TransportScreen),
  entry('hostel', 'Hostel', 'Hostel', 'apartment', true, [HOSTEL_WARDEN], 'desk', HostelScreen),
  entry('exam_setup', 'ExamSetup', 'Exam Setup', 'fact-check', true, [EXAM_ADMIN], 'desk', ExamSetupScreen),
  entry('placement', 'Placement', 'Placement', 'work', true, [PLACEMENT_OFFICER], 'desk', PlacementScreen),
  // Approvals: the main tabs for Principal / VP; in More for teachers (their tabs are full)
  entry('student_leave', 'StudentLeave', 'Leave Approvals', 'fact-check', true, [...TEACHING, ...LEADERS], 'teaching', StudentLeaveScreen),
  entry('attendance', 'AttendanceCorrections', 'Corrections', 'rule', true, CORRECTION_REVIEWERS, 'teaching', AttendanceCorrectionsScreen, 'attendance_corrections'),
  // materials.view: Teacher, HOD, Staff (sharing needs materials.upload — Teacher, HOD)
  entry('materials', 'Materials', 'Study Materials', 'library-books', false, [...TEACHING, STAFF], 'teaching', MaterialsScreen),
  entry('timetable', 'Timetable', 'Timetable', 'calendar-today', true, OWN_TIMETABLE, 'work', TimetableScreen),
  entry('leave', 'Leave', 'My Leave', 'event-available', false, ALL_STAFF_ROLES, 'work', LeaveScreen),
  entry('exam_duties', 'ExamDuties', 'Exam Duties', 'assignment-ind', false, ALL_STAFF_ROLES, 'work', ExamDutiesScreen),
  entry('announcements', 'Notices', 'Notices', 'campaign', false, ALL_STAFF_ROLES, 'communication', NoticesScreen),
  entry('academic_calendar', 'AcademicCalendar', 'Calendar', 'calendar-month', false, ALL_STAFF_ROLES, 'communication', AcademicCalendarScreen),
  // ptm.manage: Teacher, HOD, Principal, VP — notes only for students of classes you teach
  entry('ptm', 'PtmNotes', 'PTM Notes', 'forum', false, [...TEACHING, ...LEADERS], 'communication', PtmNotesScreen),
  // messaging.access; hidden by default (catalog defaultHidden) until Super Admin turns it on
  entry('messages', 'Messages', 'Messages', 'chat', false, [...TEACHING, ...LEADERS, STAFF], 'communication', MessagesScreen),
];

export interface ModuleLayout {
  tabs: ModuleEntry[];
  more: ModuleEntry[];
}

/** Splits the modules this role can see into bottom tabs and More-menu items. */
export function buildModuleLayout(role: string | undefined, isVisible: (key: string) => boolean): ModuleLayout {
  const visible = MODULE_REGISTRY.filter((m) => !!role && m.roles.includes(role) && isVisible(m.key));
  const tabs = visible.filter((m) => m.tabEligible).slice(0, MAX_MODULE_TABS);
  const more = visible.filter((m) => !tabs.includes(m));
  return { tabs, more };
}

export function useModuleLayout(): ModuleLayout {
  const { user } = useAuth();
  const { isVisible } = useAppModules();
  return buildModuleLayout(user?.role, isVisible);
}
