import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { DashboardScreen } from '../modules/dashboard/screens/DashboardScreen';
import { MoreNavigator } from './MoreNavigator';
import { useModuleLayout } from './moduleRegistry';
import { accentFor, headerOptions } from './headerOptions';
import { useParent } from '../store/ParentContext';
import { colors, radius, shadow } from '../constants/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Requires the font actually linked per-platform: android/app/build.gradle applies
// react-native-vector-icons' fonts.gradle; iOS still needs the .ttf added to the
// Xcode project's Copy Bundle Resources on a Mac (see ios/*/Info.plist's UIAppFonts).
const tabIcon = (name: string, accentSoft: string) =>
  function TabIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
    return (
      <View style={[styles.iconWrap, focused && { backgroundColor: accentSoft }]}>
        <Icon name={name} color={color} size={size - 2} />
      </View>
    );
  };

/** Home · <up to 3 visible module tabs> · More — module tabs come from moduleRegistry. */
export function MainTabNavigator() {
  const { tabs } = useModuleLayout();
  const { isParent } = useParent();
  const accent = accentFor(isParent);
  const accentSoft = isParent ? colors.parentLight : colors.primaryLight;

  return (
    <Tab.Navigator
      screenOptions={{
        ...headerOptions(accent),
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ title: 'Home', headerShown: false, tabBarIcon: tabIcon('home', accentSoft) }}
      />
      {tabs.map((m) => (
        <Tab.Screen
          key={m.screen}
          name={m.screen}
          component={m.component}
          options={{ title: m.label, tabBarIcon: tabIcon(m.icon, accentSoft) }}
        />
      ))}
      <Tab.Screen
        name="More"
        component={MoreNavigator}
        options={{ headerShown: false, tabBarIcon: tabIcon('grid-view', accentSoft) }}
      />
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
});
