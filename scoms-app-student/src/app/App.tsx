import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../services/api/queryClient';
import { AuthProvider } from '../store/AuthContext';
import { RootNavigator } from '../navigation/RootNavigator';
import { usePushRegistration } from '../hooks/usePushRegistration';

function AppContent() {
  usePushRegistration();
  return <RootNavigator />;
}

export function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar barStyle="light-content" />
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
