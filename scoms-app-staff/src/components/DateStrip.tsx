import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '../constants/theme';
import { addDays, startOfToday, ymd } from '../utils/dates';

interface Props {
  /** Selected date, YYYY-MM-DD */
  value: string;
  onChange: (value: string) => void;
  /** How many days from today to offer (default 45) */
  daysAhead?: number;
  /** Mark Sundays in red (holidays for most institutions) */
  highlightSundays?: boolean;
  /** 'past' = today, yesterday, ... (e.g. when a meeting happened); default 'future' */
  direction?: 'future' | 'past';
}

/** Horizontal strip of upcoming days to tap — a date picker without a native dependency. */
export function DateStrip({ value, onChange, daysAhead = 45, highlightSundays = true, direction = 'future' }: Props) {
  const days = useMemo(() => {
    const today = startOfToday();
    const step = direction === 'past' ? -1 : 1;
    return Array.from({ length: daysAhead }, (_, i) => addDays(today, i * step));
  }, [daysAhead, direction]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {days.map((d, i) => {
        const key = ymd(d);
        const selected = key === value;
        const sunday = highlightSundays && d.getDay() === 0;
        return (
          <TouchableOpacity
            key={key}
            onPress={() => onChange(key)}
            style={[styles.day, selected && styles.daySelected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={d.toDateString()}
          >
            <Text style={[styles.dow, sunday && styles.sunday, selected && styles.onSelected]}>
              {i === 0 ? 'TODAY' : direction === 'past' && i === 1 ? 'YDAY' : d.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()}
            </Text>
            <Text style={[styles.num, selected && styles.onSelected]}>{d.getDate()}</Text>
            <Text style={[styles.mon, selected && styles.onSelected]}>{d.toLocaleDateString('en-IN', { month: 'short' })}</Text>
            {!selected && i === 0 ? <View style={styles.todayDot} /> : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: spacing.xs, paddingRight: spacing.md },
  day: {
    width: 58,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    ...shadow(1),
  },
  daySelected: { backgroundColor: colors.primary },
  dow: { ...typography.overline, fontSize: 10, color: colors.textSecondary },
  sunday: { color: colors.danger },
  num: { ...typography.h2, color: colors.textPrimary, marginVertical: 1 },
  mon: { ...typography.caption, fontSize: 11, color: colors.textSecondary },
  onSelected: { color: '#fff' },
  todayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 3 },
});
