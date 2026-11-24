import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, radius, shadow, spacing, typography } from '../constants/theme';

interface Props {
  label: string;
  value: string;
  hint?: string;
  icon: string;
  /** { solid, soft } accent — usually moduleColor(key) */
  accent: { solid: string; soft: string };
  /** Highlights the value (e.g. something waiting for you) */
  alert?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

/** Dashboard number tile: coloured icon chip, big value, label and hint. */
export function StatTile({ label, value, hint, icon, accent, alert, onPress, style }: Props) {
  const body = (
    <View style={[styles.tile, !onPress && styles.cell, !onPress && style]}>
      <View style={styles.top}>
        <View style={[styles.iconChip, { backgroundColor: accent.soft }]}>
          <Icon name={icon} size={20} color={accent.solid} />
        </View>
        {alert ? <View style={[styles.dot, { backgroundColor: colors.danger }]} /> : null}
      </View>
      <Text style={[styles.value, { color: alert ? accent.solid : colors.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      {hint ? <Text style={styles.hint} numberOfLines={1}>{hint}</Text> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} style={[styles.cell, style]}>
      {body}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: { flexBasis: '48%', marginBottom: spacing.md },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow(1),
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  iconChip: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 2 },
  value: { ...typography.display, fontSize: 26 },
  label: { ...typography.caption, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
