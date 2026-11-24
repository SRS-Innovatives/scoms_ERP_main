import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { useAppModules } from '../store/AppModulesContext';
import { useParent } from '../store/ParentContext';
import { LoadingView } from '../components/LoadingView';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { ChildPickerScreen } from '../modules/parent/screens/ChildPickerScreen';
import { ParentStatusScreen } from '../modules/parent/screens/ParentStatusScreen';
import { ChildSwitcherSheet } from '../modules/parent/components/ChildSwitcherSheet';

/**
 * Logged out → Auth. Logged in:
 *   parent with no linked child / load error → ParentStatusScreen
 *   parent with 2+ children and no choice yet → ChildPickerScreen
 *   otherwise, once the module list is loaded → main tabs
 */
export function RootNavigator() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const { isReady: modulesReady } = useAppModules();
  const { status: parentStatus } = useParent();

  if (isBootstrapping) return <LoadingView />;
  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  if (parentStatus === 'loading') return <LoadingView />;
  if (parentStatus === 'no-children' || parentStatus === 'error') return <ParentStatusScreen kind={parentStatus} />;
  if (parentStatus === 'needs-choice') return <ChildPickerScreen />;
  // Wait for the module list so tabs don't flash in and then disappear
  if (!modulesReady) return <LoadingView />;

  return (
    <NavigationContainer>
      <MainTabNavigator />
      <ChildSwitcherSheet />
    </NavigationContainer>
  );
}
