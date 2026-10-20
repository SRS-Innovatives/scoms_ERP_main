import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreStackParamList } from './types';
import { MoreMenuScreen } from '../modules/dashboard/screens/MoreMenuScreen';
import { TimetableScreen } from '../modules/timetable/screens/TimetableScreen';
import { LeaveScreen } from '../modules/leave/screens/LeaveScreen';
import { NotificationsScreen } from '../modules/notifications/screens/NotificationsScreen';
import { ProfileScreen } from '../modules/profile/screens/ProfileScreen';
import { colors } from '../constants/theme';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
      <Stack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: 'More' }} />
      <Stack.Screen name="Timetable" component={TimetableScreen} options={{ title: 'Timetable' }} />
      <Stack.Screen name="Leave" component={LeaveScreen} options={{ title: 'Leave' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}
