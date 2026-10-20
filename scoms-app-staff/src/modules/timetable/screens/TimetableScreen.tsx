import React from 'react';
import { SectionList, StyleSheet, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Card } from '../../../components/Card';
import { TimetableEntry, fetchMyTimetable } from '../services/timetableService';

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

function groupByDay(entries: TimetableEntry[]) {
  const byDay = new Map<string, TimetableEntry[]>();
  entries.forEach((e) => {
    if (!byDay.has(e.dayOfWeek)) byDay.set(e.dayOfWeek, []);
    byDay.get(e.dayOfWeek)!.push(e);
  });
  return DAY_ORDER.filter((d) => byDay.has(d)).map((day) => ({ title: day, data: byDay.get(day)! }));
}

export function TimetableScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['staff', 'timetable'],
    queryFn: fetchMyTimetable,
  });

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorView onRetry={refetch} />;
  if (!data?.length) return <EmptyView title="No timetable published yet" />;

  return (
    <SectionList
      style={styles.container}
      contentContainerStyle={styles.content}
      sections={groupByDay(data)}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => <Text style={styles.dayHeader}>{section.title}</Text>}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Text style={styles.title}>{item.subject?.name ?? item.label ?? 'Free Period'}</Text>
          <Text style={styles.meta}>{item.startTime} – {item.endTime}</Text>
          <Text style={styles.meta}>
            {item.timetable.section.semester.course.name} · {item.timetable.section.name}
          </Text>
          {item.roomNumber ? <Text style={styles.meta}>Room {item.roomNumber}</Text> : null}
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  dayHeader: { ...typography.h3, color: colors.primary, marginTop: spacing.md, marginBottom: spacing.sm },
  card: { marginBottom: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
