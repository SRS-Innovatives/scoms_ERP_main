import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { DashboardScreen } from '../modules/dashboard/screens/DashboardScreen';
import { AttendanceScreen } from '../modules/attendance/screens/AttendanceScreen';
import { TimetableScreen } from '../modules/timetable/screens/TimetableScreen';
import { HomeworkScreen } from '../modules/homework/screens/HomeworkScreen';
import { MoreNavigator } from './MoreNavigator';
import { colors } from '../constants/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Requires the font actually linked per-platform: android/app/build.gradle applies
// react-native-vector-icons' fonts.gradle; iOS still needs the .ttf added to the
// Xcode project's Copy Bundle Resources on a Mac (see ios/*/Info.plist's UIAppFonts).
const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  Home: 'home',
  Attendance: 'assignment-turned-in',
  Timetable: 'calendar-today',
  Homework: 'menu-book',
  More: 'more-horiz',
};

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTintColor: colors.primary,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ color, size }) => (
          <Icon name={TAB_ICONS[route.name as keyof MainTabParamList]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Timetable" component={TimetableScreen} />
      <Tab.Screen name="Homework" component={HomeworkScreen} />
      <Tab.Screen name="More" component={MoreNavigator} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}
