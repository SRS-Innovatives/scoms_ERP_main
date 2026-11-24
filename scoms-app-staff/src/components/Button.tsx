import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, radius, shadow, spacing, typography } from '../constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** primary = solid brand, secondary = outlined, danger = outlined red */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Background for the primary variant (e.g. a module accent). */
  color?: string;
  /** MaterialIcons name shown before the label */
  icon?: string;
  style?: ViewStyle;
}

export function Button({ label, onPress, loading, disabled, variant = 'primary', color, icon, style }: Props) {
  const isDisabled = disabled || loading;
  const solid = variant === 'primary';
  const tint = variant === 'danger' ? colors.danger : color ?? colors.primary;
  const fg = solid ? '#fff' : tint;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={[
        styles.base,
        solid
          ? [styles.primary, { backgroundColor: tint }]
          : [styles.outline, { borderColor: variant === 'danger' ? colors.dangerLight : colors.border }],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={20} color={fg} style={styles.icon} /> : null}
          <Text style={[styles.label, { color: fg }]}>{label}</Text>
        </View>
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
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  label: { ...typography.h3 },
});
