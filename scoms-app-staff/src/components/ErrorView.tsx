import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, radius, spacing, typography } from '../constants/theme';
import { Button } from './Button';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorView({ message = 'Something went wrong. Please try again.', onRetry }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon name="cloud-off" size={34} color={colors.danger} />
      </View>
      <Text style={styles.title}>Unable to load</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <Button label="Try again" icon="refresh" onPress={onRetry} style={styles.retry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
  message: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  retry: { minWidth: 160 },
});
