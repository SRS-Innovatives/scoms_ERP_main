import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../services/api/queryClient';
import { AuthProvider } from '../store/AuthContext';
import { ParentProvider } from '../store/ParentContext';
import { AppModulesProvider } from '../store/AppModulesContext';
import { RootNavigator } from '../navigation/RootNavigator';
import { usePushRegistration } from '../hooks/usePushRegistration';

function AppContent() {
  usePushRegistration();
  return <RootNavigator />;
}

export function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {/* Parent before AppModules: a parent's module list is fetched for the active child */}
            <ParentProvider>
              <AppModulesProvider>
                <StatusBar barStyle="dark-content" />
                <AppContent />
              </AppModulesProvider>
            </ParentProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
