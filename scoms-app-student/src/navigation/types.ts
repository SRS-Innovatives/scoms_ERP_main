import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

/** Screens that belong to an app module — mounted only when that module is visible
 * (see moduleRegistry.tsx), either as a bottom tab or inside the More stack. */
export type ModuleScreenName =
  | 'Attendance'
  | 'Timetable'
  | 'Homework'
  | 'Examination'
  | 'Fees'
  | 'Certificates'
  | 'Leave'
  | 'Announcements'
  | 'AcademicCalendar'
  | 'Materials'
  | 'Gallery'
  | 'Transport'
  | 'Discipline'
  | 'Health'
  | 'PtmNotes';

type ModuleScreens = { [K in ModuleScreenName]: undefined };

export type MoreStackParamList = {
  MoreMenu: undefined;
  Notifications: undefined;
  Profile: undefined;
  EditParentProfile: undefined;
} & ModuleScreens;

export type MainTabParamList = {
  Home: undefined;
  More: NavigatorScreenParams<MoreStackParamList> | undefined;
} & ModuleScreens;
