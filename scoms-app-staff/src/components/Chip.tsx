import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';

export type ChipTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

const TONES: Record<ChipTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceMuted, fg: colors.textSecondary },
  brand: { bg: colors.primarySoft, fg: colors.primaryDark },
  success: { bg: colors.successLight, fg: '#047857' },
  warning: { bg: colors.warningLight, fg: '#B45309' },
  danger: { bg: colors.dangerLight, fg: '#B91C1C' },
  info: { bg: colors.infoLight, fg: '#0369A1' },
};

interface Props {
  label: string;
  tone?: ChipTone;
  /** Selectable chip (filters, choices): filled brand when selected */
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

/** Status pill (tone) or a selectable filter chip (onPress + selected). */
export function Chip({ label, tone = 'neutral', selected, onPress, style }: Props) {
  const t = onPress
    ? selected
      ? { bg: colors.primary, fg: '#fff' }
      : { bg: colors.surface, fg: colors.textPrimary }
    : TONES[tone];
  const content = <Text style={[styles.text, { color: t.fg }]}>{label}</Text>;
  const chipStyle = [styles.chip, { backgroundColor: t.bg }, onPress && !selected && styles.outlined, style];
  if (!onPress) return <View style={chipStyle}>{content}</View>;
  return (
    <TouchableOpacity onPress={onPress} style={chipStyle} accessibilityRole="button" accessibilityState={{ selected: !!selected }}>
      {content}
    </TouchableOpacity>
  );
}

/** Tone for the usual workflow statuses (PENDING / APPROVED / REJECTED / …). */
export function statusTone(status: string | null | undefined): ChipTone {
  switch ((status || '').toUpperCase()) {
    case 'APPROVED':
    case 'PUBLISHED':
    case 'COMPLETED':
    case 'ACTIVE':
    case 'PRESENT':
    case 'EVALUATED':
      return 'success';
    case 'PENDING':
    case 'SUBMITTED':
    case 'DRAFT':
      return 'warning';
    case 'REJECTED':
    case 'CANCELLED':
    case 'ABSENT':
    case 'OVERDUE':
      return 'danger';
    case 'CLOSED':
      return 'neutral';
    default:
      return 'info';
  }
}

const styles = StyleSheet.create({
  chip: { alignSelf: 'flex-start', borderRadius: radius.full, paddingHorizontal: spacing.sm + 2, paddingVertical: 4 },
  outlined: { borderWidth: 1, borderColor: colors.border },
  text: { ...typography.caption, fontWeight: '700' },
});
