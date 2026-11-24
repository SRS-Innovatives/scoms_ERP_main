import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreStackParamList } from './types';
import { MoreMenuScreen } from '../modules/dashboard/screens/MoreMenuScreen';
import { NotificationsScreen } from '../modules/notifications/screens/NotificationsScreen';
import { ProfileScreen } from '../modules/profile/screens/ProfileScreen';
import { EditParentProfileScreen } from '../modules/parent/screens/EditParentProfileScreen';
import { useModuleLayout } from './moduleRegistry';
import { accentFor, headerOptions } from './headerOptions';
import { useParent } from '../store/ParentContext';
import { colors } from '../constants/theme';

const Stack = createNativeStackNavigator<MoreStackParamList>();

/** More menu + every visible module that didn't get a bottom tab, plus the core screens. */
export function MoreNavigator() {
  const { more } = useModuleLayout();
  const { isParent } = useParent();

  return (
    <Stack.Navigator
      screenOptions={{ ...headerOptions(accentFor(isParent)), contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: 'Explore' }} />
      {more.map((m) => (
        <Stack.Screen key={m.screen} name={m.screen} component={m.component} options={{ title: m.label }} />
      ))}
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: isParent ? 'My Account' : 'Profile' }} />
      {isParent && (
        <Stack.Screen name="EditParentProfile" component={EditParentProfileScreen} options={{ title: 'Edit my details' }} />
      )}
    </Stack.Navigator>
  );
}
