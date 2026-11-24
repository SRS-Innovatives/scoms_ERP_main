import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
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
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {/* Dark icons on the white headers; the dashboard's teal hero switches to light while focused */}
          <StatusBar barStyle="dark-content" />
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
