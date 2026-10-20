import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { Card } from '../../../components/Card';
import { fetchAttendanceSummary } from '../services/attendanceService';

export function AttendanceScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['attendance', 'summary'],
    queryFn: fetchAttendanceSummary,
  });

  if (isLoading) return <LoadingView />;
  if (isError || !data) return <ErrorView onRetry={refetch} />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={data.subjectBreakdown}
      keyExtractor={(item) => item.subject}
      ListHeaderComponent={
        <Card style={styles.summaryCard}>
          <Text style={styles.percentage}>{Math.round(data.percentage)}%</Text>
          <Text style={styles.subtitle}>Overall Attendance</Text>
          <View style={styles.row}>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{data.presentCount}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{data.absentCount}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{data.totalClasses}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </Card>
      }
      renderItem={({ item }) => (
        <Card style={styles.subjectCard}>
          <View style={styles.subjectRow}>
            <Text style={styles.subjectName}>{item.subject}</Text>
            <Text style={styles.subjectPercent}>{Math.round(item.percentage)}%</Text>
          </View>
          <Text style={styles.subjectMeta}>{item.present} / {item.total} classes attended</Text>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  summaryCard: { marginBottom: spacing.md },
  percentage: { ...typography.h1, fontSize: 40, color: colors.primary, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  statBlock: { alignItems: 'center' },
  statValue: { ...typography.h2, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  subjectCard: { marginBottom: spacing.sm },
  subjectRow: { flexDirection: 'row', justifyContent: 'space-between' },
  subjectName: { ...typography.h3, color: colors.textPrimary },
  subjectPercent: { ...typography.h3, color: colors.primary },
  subjectMeta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
