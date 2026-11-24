/**
 * Navigation built from App Module Access: which modules become bottom tabs, which go
 * into More, and that hidden modules appear nowhere. Screens and the store are mocked so
 * this runs without native modules.
 */
jest.mock('../src/store/AppModulesContext', () => ({ useAppModules: jest.fn() }));
jest.mock('../src/components/ModuleUnavailableView', () => ({ ModuleUnavailableView: () => null }));
jest.mock('../src/modules/attendance/screens/AttendanceScreen', () => ({ AttendanceScreen: () => null }));
jest.mock('../src/modules/timetable/screens/TimetableScreen', () => ({ TimetableScreen: () => null }));
jest.mock('../src/modules/homework/screens/HomeworkScreen', () => ({ HomeworkScreen: () => null }));
jest.mock('../src/modules/examination/screens/ExaminationScreen', () => ({ ExaminationScreen: () => null }));
jest.mock('../src/modules/fees/screens/FeesScreen', () => ({ FeesScreen: () => null }));
jest.mock('../src/modules/certificates/screens/CertificatesScreen', () => ({ CertificatesScreen: () => null }));
jest.mock('../src/modules/leave/screens/LeaveScreen', () => ({ LeaveScreen: () => null }));
jest.mock('../src/modules/communication/screens/AnnouncementsScreen', () => ({ AnnouncementsScreen: () => null }));
jest.mock('../src/modules/calendar/screens/AcademicCalendarScreen', () => ({ AcademicCalendarScreen: () => null }));
jest.mock('../src/modules/materials/screens/MaterialsScreen', () => ({ MaterialsScreen: () => null }));
jest.mock('../src/modules/gallery/screens/GalleryScreen', () => ({ GalleryScreen: () => null }));
jest.mock('../src/modules/transport/screens/TransportScreen', () => ({ TransportScreen: () => null }));
jest.mock('../src/modules/parent/screens/DisciplineScreen', () => ({ DisciplineScreen: () => null }));
jest.mock('../src/modules/parent/screens/HealthRecordsScreen', () => ({ HealthRecordsScreen: () => null }));
jest.mock('../src/modules/parent/screens/PtmNotesScreen', () => ({ PtmNotesScreen: () => null }));

import { buildModuleLayout, MAX_MODULE_TABS, MODULE_REGISTRY } from '../src/navigation/moduleRegistry';
import { LEGACY_REQUIRES, MODULE_KEYS } from '../src/navigation/moduleKeys';

const only = (...keys: string[]) => (key: string) => keys.includes(key);
const screens = (list: { screen: string }[]) => list.map((m) => m.screen);

test('everything visible → first 3 tab-eligible modules are tabs, the rest go to More', () => {
  const { tabs, more } = buildModuleLayout(() => true);
  expect(screens(tabs)).toEqual(['Attendance', 'Timetable', 'Homework']);
  expect(screens(more)).toEqual(['Fees', 'Examination', 'Certificates', 'Leave', 'Announcements', 'AcademicCalendar', 'Materials', 'Transport', 'Gallery', 'Discipline', 'Health', 'PtmNotes']);
  expect(tabs.length).toBeLessThanOrEqual(MAX_MODULE_TABS);
});

test('parent-corner modules never become tabs and are marked for the Parent Corner section', () => {
  const { tabs, more } = buildModuleLayout(only('discipline', 'health', 'ptm'));
  expect(tabs).toEqual([]);
  expect(more.map((m) => m.section)).toEqual(['parent', 'parent', 'parent']);
});

test('a hidden module disappears and the next one takes its tab slot', () => {
  const { tabs, more } = buildModuleLayout((k) => k !== 'attendance');
  expect(screens(tabs)).toEqual(['Timetable', 'Homework', 'Fees']);
  expect(screens(more)).toEqual(['Examination', 'Certificates', 'Leave', 'Announcements', 'AcademicCalendar', 'Materials', 'Transport', 'Gallery', 'Discipline', 'Health', 'PtmNotes']);
  expect(screens([...tabs, ...more])).not.toContain('Attendance');
});

test('non-tab-eligible modules never become tabs', () => {
  const { tabs, more } = buildModuleLayout(only('certificates', 'fees'));
  expect(screens(tabs)).toEqual(['Fees']);
  expect(screens(more)).toEqual(['Certificates']);
});

test('nothing visible → no module tabs or More entries (Home, More and core screens remain)', () => {
  const { tabs, more } = buildModuleLayout(() => false);
  expect(tabs).toEqual([]);
  expect(more).toEqual([]);
});

test('every registry entry has a key, a legacy fallback mapping and a unique screen', () => {
  const keys = MODULE_REGISTRY.map((m) => m.key);
  expect(new Set(keys).size).toBe(keys.length);
  expect(new Set(MODULE_REGISTRY.map((m) => m.screen)).size).toBe(keys.length);
  expect(keys.sort()).toEqual(Object.values(MODULE_KEYS).sort());
  keys.forEach((k) => expect(LEGACY_REQUIRES).toHaveProperty(k));
});
