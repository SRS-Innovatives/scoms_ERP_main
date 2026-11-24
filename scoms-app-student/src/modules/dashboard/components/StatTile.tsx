import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, radius, shadow, spacing, typography } from '../../../constants/theme';

interface Props {
  label: string;
  value: string;
  hint?: string;
  icon: string;
  /** Module accent: icon chip + value colour */
  color: string;
  soft: string;
  /** 0..1 — draws a progress bar under the value (e.g. attendance %) */
  progress?: number;
  onPress?: () => void;
}

export function StatTile({ label, value, hint, icon, color, soft, progress, onPress }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={styles.tile}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={styles.top}>
        <View style={[styles.iconChip, { backgroundColor: soft }]}>
          <Icon name={icon} size={20} color={color} />
        </View>
        {onPress ? <Icon name="arrow-outward" size={16} color={colors.disabled} /> : null}
      </View>
      <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {progress !== undefined ? (
        <View style={[styles.track, { backgroundColor: soft }]}>
          <View style={[styles.fill, { backgroundColor: color, width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} />
        </View>
      ) : hint ? (
        <Text style={styles.hint} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md - 2,
    marginHorizontal: spacing.xs,
    minHeight: 132,
    ...shadow(1),
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  iconChip: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  value: { ...typography.h2, fontSize: 22, fontWeight: '800' },
  label: { ...typography.caption, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, fontSize: 11 },
  track: { height: 6, borderRadius: 3, marginTop: spacing.sm, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
