import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, typography } from '../constants/theme';

interface Props {
  label?: string;
}

/** Shown instead of a module screen the user can't see (hidden by Super Admin, or the
 * institution doesn't have the module). Navigation normally drops such screens already;
 * this covers the moment between the change and the next module-list refresh. */
export function ModuleUnavailableView({ label }: Props) {
  return (
    <View style={styles.container}>
      <Icon name="lock-outline" size={40} color={colors.textSecondary} />
      <Text style={styles.title}>{label ? `${label} is not available` : 'Not available'}</Text>
      <Text style={styles.message}>
        This feature isn't turned on in the app for your institution. Please contact your institution if you need it.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background },
  title: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.xs, textAlign: 'center' },
  message: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
