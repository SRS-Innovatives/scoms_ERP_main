import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';
import { Button } from './Button';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorView({ message = 'Something went wrong. Please try again.', onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unable to load</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <Button label="Retry" onPress={onRetry} style={styles.retry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background },
  title: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
  message: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  retry: { minWidth: 140 },
});
