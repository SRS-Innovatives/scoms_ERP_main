import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { DashboardScreen } from '../modules/dashboard/screens/DashboardScreen';
import { MoreNavigator } from './MoreNavigator';
import { useModuleLayout } from './moduleRegistry';
import { headerOptions } from './headerOptions';
import { useRefreshAppModulesOnForeground } from '../services/api/appModules';
import { colors, radius, shadow } from '../constants/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Requires the font actually linked per-platform: android/app/build.gradle applies
// react-native-vector-icons' fonts.gradle; iOS still needs the .ttf added to the
// Xcode project's Copy Bundle Resources on a Mac (see ios/*/Info.plist's UIAppFonts).
const tabIcon = (name: string) =>
  function TabIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
    return (
      <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
        <Icon name={name} color={color} size={size - 2} />
      </View>
    );
  };

/** Home · <up to 3 module tabs for this role> · More — built from moduleRegistry, which
 * follows Super Admin's App Module Access (Staff App) and the signed-in role. */
export function MainTabNavigator() {
  useRefreshAppModulesOnForeground();
  const { tabs } = useModuleLayout();

  return (
    <Tab.Navigator
      screenOptions={{
        ...headerOptions,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ headerShown: false, tabBarIcon: tabIcon('home') }} />
      {tabs.map((m) => (
        <Tab.Screen
          key={m.screen}
          name={m.screen}
          component={m.component}
          options={{ title: m.label, tabBarIcon: tabIcon(m.icon) }}
        />
      ))}
      <Tab.Screen name="More" component={MoreNavigator} options={{ headerShown: false, tabBarIcon: tabIcon('grid-view') }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // No fixed height / absolute position: React Navigation then adds the device's bottom
  // safe-area inset itself and screens keep their full content area above the bar.
  tabBar: {
    paddingTop: 6,
    borderTopWidth: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    ...shadow(3),
  },
  label: { fontSize: 11, fontWeight: '700' },
  iconWrap: { width: 44, height: 28, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  iconWrapFocused: { backgroundColor: colors.primarySoft },
});
