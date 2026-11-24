import React, { useMemo, useState } from 'react';
import { ScrollView, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery } from '@tanstack/react-query';
import { colors, moduleColor, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Chip } from '../../../components/Chip';
import { queryKeys } from '../../../services/api/queryKeys';
import { daysFromToday } from '../../../utils/dates';
import { ExamDuty, fetchMyExamDuties } from '../services/examDutiesService';

const tint = moduleColor('exam_duties');

const dayLabel = (iso: string) => {
  const d = daysFromToday(iso);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

function DutyRow({ duty, last }: { duty: ExamDuty; last: boolean }) {
  const d = daysFromToday(duty.date);
  const soon = duty.upcoming && d <= 1;
  return (
    <View style={[styles.row, !last && styles.rowDivider, !duty.upcoming && styles.past]}>
      <View style={[styles.dateBox, soon && { backgroundColor: tint.solid }]}>
        <Text style={[styles.dateDay, soon && styles.onTint]}>{new Date(duty.date).getDate()}</Text>
        <Text style={[styles.dateMon, soon && styles.onTint]}>{new Date(duty.date).toLocaleDateString('en-IN', { month: 'short' })}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.subject} numberOfLines={1}>{duty.subject}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {dayLabel(duty.date)} · {duty.startTime}–{duty.endTime}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[duty.className, duty.room ? `Room ${duty.room}` : null].filter(Boolean).join(' · ')}
        </Text>
        {duty.remarks ? <Text style={styles.remarks}>{duty.remarks}</Text> : null}
      </View>
      <Chip label={duty.roleLabel} tone={duty.upcoming ? 'info' : 'neutral'} />
    </View>
  );
}

/** Exam duties (invigilation etc.) the Institute Admin allotted to me. */
export function ExamDutiesScreen() {
  const q = useQuery({ queryKey: queryKeys.examDuties, queryFn: fetchMyExamDuties, staleTime: 5 * 60_000 });
  const [showPast, setShowPast] = useState(false);

  const next = useMemo(() => {
    const upcoming = (q.data ?? []).flatMap((g) => g.duties.filter((d) => d.upcoming).map((d) => ({ ...d, exam: g.exam.name })));
    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.startTime.localeCompare(b.startTime));
    return { first: upcoming[0] ?? null, count: upcoming.length };
  }, [q.data]);

  if (q.isLoading) return <LoadingView />;
  if (q.isError) return <ErrorView onRetry={q.refetch} />;
  if (!q.data?.length) return <EmptyView icon="assignment-ind" title="No exam duties" message="Duties the exam office allots to you appear here." />;

  const groups = q.data
    .map((g) => ({ ...g, duties: g.duties.filter((d) => showPast || d.upcoming) }))
    .filter((g) => g.duties.length);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={
        <RefreshControl
          refreshing={q.isRefetching}
          onRefresh={() => {
            q.refetch();
          }}
        />
      }>
      {next.first ? (
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>NEXT DUTY</Text>
          <Text style={styles.heroTitle}>{next.first.roleLabel} · {next.first.subject}</Text>
          <Text style={styles.heroMeta}>
            {dayLabel(next.first.date)} · {next.first.startTime}–{next.first.endTime}
            {next.first.room ? ` · Room ${next.first.room}` : ''}
          </Text>
          <Text style={styles.heroMeta}>{next.first.exam} · {next.count} upcoming</Text>
        </View>
      ) : (
        <View style={styles.doneCard}>
          <Icon name="task-alt" size={24} color={colors.success} />
          <Text style={styles.doneText}>No upcoming duties.</Text>
        </View>
      )}

      {groups.map((g) => (
        <View key={g.exam.id} style={styles.group}>
          <Text style={styles.groupTitle}>{g.exam.name}</Text>
          <View style={styles.card}>
            {g.duties.map((d, i) => (
              <DutyRow key={d.id} duty={d} last={i === g.duties.length - 1} />
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity onPress={() => setShowPast((v) => !v)} style={styles.toggle} accessibilityRole="button">
        <Text style={styles.toggleText}>{showPast ? 'Hide past duties' : 'Show past duties'}</Text>
      </TouchableOpacity>
      <Text style={styles.footNote}>The printable duty allotment letter is on the SCOMS web portal.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  hero: { backgroundColor: tint.solid, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, ...shadow(2) },
  heroLabel: { ...typography.overline, color: colors.textOnDarkMuted },
  heroTitle: { ...typography.h2, color: '#fff', marginTop: 2 },
  heroMeta: { ...typography.caption, color: colors.textOnDarkMuted, marginTop: 2 },
  doneCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, ...shadow(1) },
  doneText: { ...typography.body, color: colors.textSecondary, marginLeft: spacing.sm },
  group: { marginBottom: spacing.lg },
  groupTitle: { ...typography.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md, ...shadow(1) },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 4 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  past: { opacity: 0.55 },
  dateBox: { width: 46, borderRadius: radius.md, backgroundColor: tint.soft, alignItems: 'center', paddingVertical: 4, marginRight: spacing.md },
  dateDay: { ...typography.h3, fontWeight: '800', color: tint.solid },
  dateMon: { ...typography.caption, fontSize: 11, color: tint.solid },
  onTint: { color: '#fff' },
  body: { flex: 1, marginRight: spacing.sm },
  subject: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  remarks: { ...typography.caption, color: colors.textPrimary, marginTop: 2, fontStyle: 'italic' },
  toggle: { alignSelf: 'center', padding: spacing.sm },
  toggleText: { ...typography.caption, fontWeight: '700', color: colors.primary },
  footNote: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
});
