import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { DashboardScreen } from '../modules/dashboard/screens/DashboardScreen';
import { AttendanceScreen } from '../modules/attendance/screens/AttendanceScreen';
import { HomeworkScreen } from '../modules/homework/screens/HomeworkScreen';
import { ExaminationScreen } from '../modules/examination/screens/ExaminationScreen';
import { LibraryScreen } from '../modules/library/screens/LibraryScreen';
import { TransportScreen } from '../modules/transport/screens/TransportScreen';
import { FeeDeskScreen } from '../modules/feeDesk/screens/FeeDeskScreen';
import { HostelScreen } from '../modules/hostel/screens/HostelScreen';
import { ExamSetupScreen } from '../modules/examSetup/screens/ExamSetupScreen';
import { PlacementScreen } from '../modules/placement/screens/PlacementScreen';
import { MoreNavigator } from './MoreNavigator';
import { colors } from '../constants/theme';
import { useAuth } from '../store/AuthContext';
import { resolveStaffTabs, StaffTabKey } from './roleNavigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Requires the font actually linked per-platform: android/app/build.gradle applies
// react-native-vector-icons' fonts.gradle; iOS still needs the .ttf added to the
// Xcode project's Copy Bundle Resources on a Mac (see ios/*/Info.plist's UIAppFonts).
const TAB_ICONS: Record<StaffTabKey, string> = {
  Home: 'home',
  Attendance: 'how-to-reg',
  Homework: 'menu-book',
  Examination: 'edit-note',
  Library: 'local-library',
  Transport: 'directions-bus',
  FeeDesk: 'payments',
  Hostel: 'apartment',
  ExamSetup: 'fact-check',
  Placement: 'work',
  More: 'more-horiz',
};

const TAB_SCREENS: Record<StaffTabKey, React.ComponentType<any>> = {
  Home: DashboardScreen,
  Attendance: AttendanceScreen,
  Homework: HomeworkScreen,
  Examination: ExaminationScreen,
  Library: LibraryScreen,
  Transport: TransportScreen,
  FeeDesk: FeeDeskScreen,
  Hostel: HostelScreen,
  ExamSetup: ExamSetupScreen,
  Placement: PlacementScreen,
  More: MoreNavigator,
};

export function MainTabNavigator() {
  const { user } = useAuth();
  const tabs = resolveStaffTabs(user?.role, user?.institution?.enabledModules);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTintColor: colors.primary,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ color, size }) => (
          <Icon name={TAB_ICONS[route.name as StaffTabKey]} color={color} size={size} />
        ),
      })}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab}
          name={tab}
          component={TAB_SCREENS[tab]}
          options={tab === 'More' ? { headerShown: false } : undefined}
        />
      ))}
    </Tab.Navigator>
  );
}
