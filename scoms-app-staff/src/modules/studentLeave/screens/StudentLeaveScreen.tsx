import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, moduleColor, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Chip, statusTone } from '../../../components/Chip';
import { queryKeys } from '../../../services/api/queryKeys';
import { shortDate } from '../../../utils/dates';
import { StudentLeaveRequest, decideStudentLeave, fetchStudentLeaves } from '../services/studentLeaveService';

type Tab = 'pending' | 'decided';

const dayCount = (l: StudentLeaveRequest) =>
  Math.round((new Date(l.endDate.slice(0, 10)).getTime() - new Date(l.startDate.slice(0, 10)).getTime()) / 86_400_000) + 1;

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');

function LeaveCard({ item, onDecide, busy }: { item: StudentLeaveRequest; onDecide: (status: 'APPROVED' | 'REJECTED') => void; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const name = item.student ? `${item.student.firstName} ${item.student.lastName}`.trim() : 'Student';
  const days = dayCount(item);
  const sameDay = days <= 1;
  const pending = item.status === 'PENDING';

  return (
    <View style={[styles.card, pending && item.canDecide && styles.cardActionable]}>
      <View style={styles.top}>
        <Avatar name={name} size={44} />
        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {[item.student?.rollNumber ? `Roll ${item.student.rollNumber}` : null, item.student?.section?.name].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Chip label={item.status} tone={statusTone(item.status)} />
      </View>

      <View style={styles.dates}>
        <Icon name="event" size={18} color={moduleColor('student_leave').solid} />
        <Text style={styles.datesText}>
          {sameDay ? shortDate(item.startDate) : `${shortDate(item.startDate)} → ${shortDate(item.endDate)}`}
        </Text>
        <View style={styles.daysPill}>
          <Text style={styles.daysText}>{days} day{days === 1 ? '' : 's'}</Text>
        </View>
      </View>

      <Text style={styles.type}>{titleCase(item.type)}</Text>
      <Text style={styles.reason} numberOfLines={open ? undefined : 3} onPress={() => setOpen((v) => !v)}>
        {item.reason}
      </Text>
      {item.hasAttachment ? (
        <View style={styles.attach}>
          <Icon name="attach-file" size={14} color={colors.textSecondary} />
          <Text style={styles.attachText}>Has an attachment — open it on the website</Text>
        </View>
      ) : null}

      {pending && item.canDecide ? (
        <View style={styles.actions}>
          <Button label="Reject" variant="danger" icon="close" onPress={() => onDecide('REJECTED')} disabled={busy} style={styles.actionBtn} />
          <Button label="Approve" icon="check" onPress={() => onDecide('APPROVED')} loading={busy} style={styles.actionBtn} color={colors.success} />
        </View>
      ) : pending ? (
        <Text style={styles.viewOnly}>View only — the class teacher decides this request.</Text>
      ) : item.approvedBy ? (
        <Text style={styles.viewOnly}>Decided by {item.approvedBy}</Text>
      ) : null}
    </View>
  );
}

/** Student leave requests for the sections this staff member decides for or teaches. */
export function StudentLeaveScreen() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('pending');
  const query = useQuery({ queryKey: queryKeys.studentLeave, queryFn: fetchStudentLeaves });

  const decide = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) => decideStudentLeave(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studentLeave });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardAll }); // dashboard: approvals count
    },
    onError: (err: any) => Alert.alert('Not saved', err?.response?.data?.message || 'Could not save the decision.'),
  });

  const all = useMemo(() => query.data ?? [], [query.data]);
  const pending = useMemo(() => all.filter((l) => l.status === 'PENDING').sort((a, b) => Number(b.canDecide) - Number(a.canDecide)), [all]);
  const decided = useMemo(() => all.filter((l) => l.status !== 'PENDING'), [all]);
  const toDecide = pending.filter((l) => l.canDecide).length;

  if (query.isLoading) return <LoadingView />;
  if (query.isError) return <ErrorView onRetry={query.refetch} />;

  const onDecide = (item: StudentLeaveRequest, status: 'APPROVED' | 'REJECTED') => {
    const name = item.student?.firstName ?? 'this student';
    Alert.alert(
      status === 'APPROVED' ? 'Approve leave?' : 'Reject leave?',
      `${name} · ${shortDate(item.startDate)}${dayCount(item) > 1 ? ` → ${shortDate(item.endDate)}` : ''}. The student and their parents will be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: status === 'APPROVED' ? 'Approve' : 'Reject', style: status === 'REJECTED' ? 'destructive' : 'default', onPress: () => decide.mutate({ id: item.id, status }) },
      ],
    );
  };

  const data = tab === 'pending' ? pending : decided;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={data}
      keyExtractor={(i) => i.id}
      refreshing={query.isRefetching}
      onRefresh={query.refetch}
      ListHeaderComponent={
        <View>
          <View style={styles.tabs}>
            {(['pending', 'decided'] as const).map((t) => (
              <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: tab === t }}>
                <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>
                  {t === 'pending' ? `Pending${pending.length ? ` (${pending.length})` : ''}` : 'Decided'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {tab === 'pending' && toDecide ? (
            <Text style={styles.hint}>{toDecide} waiting for your decision</Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyView
          icon="fact-check"
          title={tab === 'pending' ? 'No pending requests' : 'Nothing decided yet'}
          message={tab === 'pending' ? 'Leave requests from your classes appear here.' : 'Approved and rejected requests appear here.'}
        />
      }
      renderItem={({ item }) => (
        <LeaveCard item={item} onDecide={(s) => onDecide(item, s)} busy={decide.isPending && decide.variables?.id === item.id} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1, marginHorizontal: spacing.sm + 2 },
  list: { padding: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.full, padding: 4, marginBottom: spacing.sm, ...shadow(1) },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm + 2, borderRadius: radius.full },
  tabOn: { backgroundColor: colors.primary },
  tabText: { fontWeight: '700', color: colors.textSecondary, fontSize: 13 },
  tabTextOn: { color: '#fff' },
  hint: { ...typography.caption, fontWeight: '700', color: colors.primaryDark, marginBottom: spacing.sm, marginLeft: spacing.xs },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm + 4, ...shadow(1) },
  cardActionable: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  top: { flexDirection: 'row', alignItems: 'center' },
  name: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  dates: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  datesText: { ...typography.body, fontWeight: '700', color: colors.textPrimary, marginLeft: spacing.sm, flex: 1 },
  daysPill: { backgroundColor: colors.surfaceMuted, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  daysText: { ...typography.caption, fontWeight: '700', color: colors.textSecondary },
  type: { ...typography.overline, color: colors.textSecondary, marginTop: spacing.sm },
  reason: { ...typography.body, color: colors.textPrimary, marginTop: 2, lineHeight: 21 },
  attach: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  attachText: { ...typography.caption, color: colors.textSecondary, marginLeft: 4 },
  actions: { flexDirection: 'row', marginTop: spacing.md, marginHorizontal: -spacing.xs },
  actionBtn: { flex: 1, marginHorizontal: spacing.xs, height: 46 },
  viewOnly: { ...typography.caption, color: colors.textSecondary, fontStyle: 'italic', marginTop: spacing.sm },
});
