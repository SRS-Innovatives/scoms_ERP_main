import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../../components/Card';
import { colors, spacing, typography } from '../../../constants/theme';

interface Props {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}

export function DashboardCard({ label, value, hint, accent = colors.primary }: Props) {
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexBasis: '48%', marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  value: { ...typography.h2 },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
