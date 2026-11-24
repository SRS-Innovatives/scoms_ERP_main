import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '../constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  /** Background for the primary variant (e.g. the parent accent). */
  color?: string;
  style?: ViewStyle;
}

export function Button({ label, onPress, loading, disabled, variant = 'primary', color, style }: Props) {
  const isDisabled = disabled || loading;
  const solid = variant === 'primary';
  const tint = variant === 'danger' ? colors.danger : color ?? colors.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      style={[
        styles.base,
        solid ? [styles.primary, { backgroundColor: tint }] : [styles.outline, { borderColor: variant === 'danger' ? colors.dangerLight : colors.border }],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={solid ? '#fff' : tint} />
      ) : (
        <Text style={[styles.label, { color: solid ? '#fff' : tint }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: { ...shadow(2) },
  outline: { backgroundColor: colors.surface, borderWidth: 1.5 },
  disabled: { opacity: 0.5 },
  label: { ...typography.h3 },
});
