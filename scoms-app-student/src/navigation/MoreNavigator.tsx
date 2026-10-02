import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreStackParamList } from './types';
import { MoreMenuScreen } from '../modules/dashboard/screens/MoreMenuScreen';
import { ExaminationScreen } from '../modules/examination/screens/ExaminationScreen';
import { FeesScreen } from '../modules/fees/screens/FeesScreen';
import { CertificatesScreen } from '../modules/certificates/screens/CertificatesScreen';
import { NotificationsScreen } from '../modules/notifications/screens/NotificationsScreen';
import { ProfileScreen } from '../modules/profile/screens/ProfileScreen';
import { colors } from '../constants/theme';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
      <Stack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: 'More' }} />
      <Stack.Screen name="Examination" component={ExaminationScreen} options={{ title: 'Examinations' }} />
      <Stack.Screen name="Fees" component={FeesScreen} options={{ title: 'Fees' }} />
      <Stack.Screen name="Certificates" component={CertificatesScreen} options={{ title: 'Certificates' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}
