/**
 * Staff navigation built from App Module Access + role: which modules become bottom tabs,
 * which go into More, and that hidden / other-role modules appear nowhere. Screens and the
 * stores are mocked so this runs without native modules.
 */
jest.mock('../src/services/api/appModules', () => ({ useAppModules: jest.fn() }));
jest.mock('../src/store/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../src/components/ModuleUnavailableView', () => ({ ModuleUnavailableView: () => null }));
jest.mock('../src/modules/attendance/screens/AttendanceScreen', () => ({ AttendanceScreen: () => null }));
jest.mock('../src/modules/homework/screens/HomeworkScreen', () => ({ HomeworkScreen: () => null }));
jest.mock('../src/modules/examination/screens/ExaminationScreen', () => ({ ExaminationScreen: () => null }));
jest.mock('../src/modules/library/screens/LibraryScreen', () => ({ LibraryScreen: () => null }));
jest.mock('../src/modules/transport/screens/TransportScreen', () => ({ TransportScreen: () => null }));
jest.mock('../src/modules/hostel/screens/HostelScreen', () => ({ HostelScreen: () => null }));
jest.mock('../src/modules/examSetup/screens/ExamSetupScreen', () => ({ ExamSetupScreen: () => null }));
jest.mock('../src/modules/placement/screens/PlacementScreen', () => ({ PlacementScreen: () => null }));
jest.mock('../src/modules/timetable/screens/TimetableScreen', () => ({ TimetableScreen: () => null }));
jest.mock('../src/modules/leave/screens/LeaveScreen', () => ({ LeaveScreen: () => null }));
jest.mock('../src/modules/studentLeave/screens/StudentLeaveScreen', () => ({ StudentLeaveScreen: () => null }));
jest.mock('../src/modules/corrections/screens/AttendanceCorrectionsScreen', () => ({ AttendanceCorrectionsScreen: () => null }));
jest.mock('../src/modules/communication/screens/NoticesScreen', () => ({ NoticesScreen: () => null }));
jest.mock('../src/modules/calendar/screens/AcademicCalendarScreen', () => ({ AcademicCalendarScreen: () => null }));
jest.mock('../src/modules/ptm/screens/PtmNotesScreen', () => ({ PtmNotesScreen: () => null }));
jest.mock('../src/modules/materials/screens/MaterialsScreen', () => ({ MaterialsScreen: () => null }));
jest.mock('../src/modules/examDuties/screens/ExamDutiesScreen', () => ({ ExamDutiesScreen: () => null }));
jest.mock('../src/modules/messages/screens/MessagesScreen', () => ({ MessagesScreen: () => null }));

import { buildModuleLayout, MAX_MODULE_TABS, MODULE_REGISTRY } from '../src/navigation/moduleRegistry';
import { LEGACY_REQUIRES, MODULE_KEYS } from '../src/navigation/moduleKeys';

// The server-side catalog, so the app can't drift from it.
const { APPS } = require('../../shared/appModules/catalog');
const CATALOG: { key: string; roles: string[]; requires: string | null }[] = APPS.STAFF_APP.modules;

const all = () => true;
const without = (...keys: string[]) => (key: string) => !keys.includes(key);
const screens = (list: { screen: string }[]) => list.map((m) => m.screen);
const COMMON_MORE = ['Leave', 'ExamDuties', 'Notices', 'AcademicCalendar'];

test('general Staff: Timetable tab; study materials and messages in More', () => {
  expect(screens(buildModuleLayout('STAFF', all).tabs)).toEqual(['Timetable']);
  expect(screens(buildModuleLayout('STAFF', all).more)).toEqual(['Materials', ...COMMON_MORE, 'Messages']);
});

test('Teacher: Attendance · Homework · Exams tabs; approvals, timetable, notices in More', () => {
  const { tabs, more } = buildModuleLayout('TEACHER', all);
  expect(screens(tabs)).toEqual(['Attendance', 'Homework', 'Examination']);
  expect(screens(more)).toEqual(['StudentLeave', 'Materials', 'Timetable', ...COMMON_MORE, 'PtmNotes', 'Messages']);
  expect(tabs.length).toBeLessThanOrEqual(MAX_MODULE_TABS);
});

test('HOD also reviews attendance corrections (in More)', () => {
  const { tabs, more } = buildModuleLayout('HOD', all);
  expect(screens(tabs)).toEqual(['Attendance', 'Homework', 'Examination']);
  expect(screens(more)).toEqual(['StudentLeave', 'AttendanceCorrections', 'Materials', 'Timetable', ...COMMON_MORE, 'PtmNotes', 'Messages']);
});

test('Principal / VP: Leave Approvals and Corrections are their tabs; no teacher screens or own timetable', () => {
  for (const role of ['PRINCIPAL', 'VICE_PRINCIPAL']) {
    const { tabs, more } = buildModuleLayout(role, all);
    expect(screens(tabs)).toEqual(['StudentLeave', 'AttendanceCorrections']);
    expect(screens(more)).toEqual([...COMMON_MORE, 'PtmNotes', 'Messages']);
  }
});

test('desk roles get their desk and Timetable as tabs; Notices and Calendar for everyone', () => {
  expect(screens(buildModuleLayout('LIBRARIAN', all).tabs)).toEqual(['Library', 'Timetable']);
  expect(screens(buildModuleLayout('TRANSPORT_MANAGER', all).tabs)).toEqual(['Transport', 'Timetable']);
  expect(screens(buildModuleLayout('HOSTEL_WARDEN', all).tabs)).toEqual(['Hostel', 'Timetable']);
  expect(screens(buildModuleLayout('EXAM_ADMIN', all).tabs)).toEqual(['ExamSetup', 'Timetable']);
  expect(screens(buildModuleLayout('PLACEMENT_OFFICER', all).tabs)).toEqual(['Placement', 'Timetable']);
  expect(screens(buildModuleLayout('ACCOUNTANT', all).tabs)).toEqual(['Timetable']);
  expect(screens(buildModuleLayout('LIBRARIAN', all).more)).toEqual(COMMON_MORE);
});

test('a hidden module disappears and the next tab-eligible one takes its slot', () => {
  const t = buildModuleLayout('TEACHER', without('attendance'));
  expect(screens(t.tabs)).toEqual(['Homework', 'Examination', 'StudentLeave']);
  expect(screens(t.more)).toEqual(['Materials', 'Timetable', ...COMMON_MORE, 'PtmNotes', 'Messages']);
  // hiding `attendance` also removes the corrections screen it backs
  expect(screens(buildModuleLayout('PRINCIPAL', without('attendance')).tabs)).toEqual(['StudentLeave']);
  expect(screens(buildModuleLayout('LIBRARIAN', without('timetable', 'announcements')).tabs)).toEqual(['Library']);
  expect(screens(buildModuleLayout('LIBRARIAN', without('timetable', 'announcements')).more)).toEqual(['Leave', 'ExamDuties', 'AcademicCalendar']);
});

test('nothing visible / no role → no module tabs or More entries', () => {
  expect(buildModuleLayout('TEACHER', () => false)).toEqual({ tabs: [], more: [] });
  expect(buildModuleLayout(undefined, all)).toEqual({ tabs: [], more: [] });
});

test('every entry: real STAFF_APP key, roles ⊆ the catalog roles, legacy mapping = catalog requires, unique screen', () => {
  MODULE_REGISTRY.forEach((m) => {
    const cat = CATALOG.find((c) => c.key === m.key);
    expect(cat).toBeDefined();
    expect(m.roles.filter((r) => !cat!.roles.includes(r))).toEqual([]);
    expect(LEGACY_REQUIRES[m.key]).toBe(cat!.requires);
  });
  expect(Object.values(MODULE_KEYS).filter((k) => !CATALOG.some((c) => c.key === k))).toEqual([]);
  const s = screens(MODULE_REGISTRY);
  expect(new Set(s).size).toBe(s.length);
});
