/**
 * The one place that maps an app module to its screen, label, icon and where it lives.
 * MainTabNavigator, MoreNavigator and the More menu are all built from this list filtered
 * by useAppModules().isVisible() — adding a module screen means adding one entry here.
 *
 * Order = tab priority: the first MAX_MODULE_TABS visible tab-eligible modules become
 * bottom tabs (between Home and More); every other visible module goes into More. So if
 * Super Admin hides Attendance, Timetable moves up and Fees takes the free tab slot.
 */
import React from 'react';
import { AttendanceScreen } from '../modules/attendance/screens/AttendanceScreen';
import { TimetableScreen } from '../modules/timetable/screens/TimetableScreen';
import { HomeworkScreen } from '../modules/homework/screens/HomeworkScreen';
import { ExaminationScreen } from '../modules/examination/screens/ExaminationScreen';
import { FeesScreen } from '../modules/fees/screens/FeesScreen';
import { CertificatesScreen } from '../modules/certificates/screens/CertificatesScreen';
import { LeaveScreen } from '../modules/leave/screens/LeaveScreen';
import { AnnouncementsScreen } from '../modules/communication/screens/AnnouncementsScreen';
import { AcademicCalendarScreen } from '../modules/calendar/screens/AcademicCalendarScreen';
import { DisciplineScreen } from '../modules/parent/screens/DisciplineScreen';
import { HealthRecordsScreen } from '../modules/parent/screens/HealthRecordsScreen';
import { PtmNotesScreen } from '../modules/parent/screens/PtmNotesScreen';
import { MaterialsScreen } from '../modules/materials/screens/MaterialsScreen';
import { GalleryScreen } from '../modules/gallery/screens/GalleryScreen';
import { TransportScreen } from '../modules/transport/screens/TransportScreen';
import { ModuleUnavailableView } from '../components/ModuleUnavailableView';
import { useAppModules } from '../store/AppModulesContext';
import { ModuleKey } from './moduleKeys';
import { ModuleScreenName } from './types';

export const MAX_MODULE_TABS = 3;

export interface ModuleEntry {
  key: ModuleKey;
  screen: ModuleScreenName;
  label: string;
  icon: string; // MaterialIcons name
  tabEligible: boolean;
  component: React.ComponentType<any>;
  /** 'parent' = listed under "Parent Corner" in the More menu */
  section?: 'parent';
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

const entry = (
  key: ModuleKey,
  screen: ModuleScreenName,
  label: string,
  icon: string,
  tabEligible: boolean,
  Screen: React.ComponentType<any>,
): ModuleEntry => ({ key, screen, label, icon, tabEligible, component: gated(key, label, Screen) });

export const MODULE_REGISTRY: ModuleEntry[] = [
  entry('attendance', 'Attendance', 'Attendance', 'assignment-turned-in', true, AttendanceScreen),
  entry('timetable', 'Timetable', 'Timetable', 'calendar-today', true, TimetableScreen),
  entry('homework', 'Homework', 'Homework', 'menu-book', true, HomeworkScreen),
  entry('fees', 'Fees', 'Fees', 'account-balance-wallet', true, FeesScreen),
  entry('examination', 'Examination', 'Examinations', 'assignment', true, ExaminationScreen),
  entry('certificates', 'Certificates', 'Certificates', 'card-membership', false, CertificatesScreen),
  entry('leave', 'Leave', 'Leave', 'event-available', false, LeaveScreen),
  entry('announcements', 'Announcements', 'Notices', 'campaign', false, AnnouncementsScreen),
  entry('academic_calendar', 'AcademicCalendar', 'Calendar', 'calendar-month', false, AcademicCalendarScreen),
  entry('materials', 'Materials', 'Study Materials', 'library-books', false, MaterialsScreen),
  entry('transport', 'Transport', 'Transport', 'directions-bus', false, TransportScreen),
  entry('gallery', 'Gallery', 'Gallery', 'photo-library', false, GalleryScreen),
  // Parent Corner — parent-only (catalog roles: [PARENT]); never bottom tabs
  { ...entry('discipline', 'Discipline', 'Discipline', 'gavel', false, DisciplineScreen), section: 'parent' },
  { ...entry('health', 'Health', 'Health', 'favorite', false, HealthRecordsScreen), section: 'parent' },
  { ...entry('ptm', 'PtmNotes', 'PTM Notes', 'forum', false, PtmNotesScreen), section: 'parent' },
];

export interface ModuleLayout {
  tabs: ModuleEntry[];
  more: ModuleEntry[];
}

/** Splits the visible modules into bottom tabs and More-menu items. */
export function buildModuleLayout(isVisible: (key: string) => boolean): ModuleLayout {
  const visible = MODULE_REGISTRY.filter((m) => isVisible(m.key));
  const tabs = visible.filter((m) => m.tabEligible).slice(0, MAX_MODULE_TABS);
  const more = visible.filter((m) => !tabs.includes(m));
  return { tabs, more };
}

export function useModuleLayout(): ModuleLayout {
  const { isVisible } = useAppModules();
  return buildModuleLayout(isVisible);
}