import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

/** Screens that belong to a Staff App module — mounted only when that module is visible
 * for this user (see moduleRegistry.tsx), either as a bottom tab or inside the More stack. */
export type ModuleScreenName =
  | 'Attendance'
  | 'Homework'
  | 'Examination'
  | 'Library'
  | 'Transport'
  | 'Hostel'
  | 'ExamSetup'
  | 'Placement'
  | 'Timetable'
  | 'Leave'
  | 'StudentLeave'
  | 'AttendanceCorrections'
  | 'Notices'
  | 'AcademicCalendar'
  | 'PtmNotes'
  | 'Materials'
  | 'ExamDuties'
  | 'Messages';

type ModuleScreens = { [K in ModuleScreenName]: undefined };

export type MoreStackParamList = {
  MoreMenu: undefined;
  Notifications: undefined;
  Profile: undefined;
} & ModuleScreens;

export type MainTabParamList = {
  Home: undefined;
  More: NavigatorScreenParams<MoreStackParamList> | undefined;
} & ModuleScreens;
