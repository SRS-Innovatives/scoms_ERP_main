import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, radius, ROLE_LABELS, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Chip, statusTone } from '../../../components/Chip';
import { useAuth } from '../../../store/AuthContext';
import { queryKeys } from '../../../services/api/queryKeys';
import { shortDate, timeAgo } from '../../../utils/dates';
import { CorrectionRequest, fetchCorrections, reviewCorrection } from '../services/correctionsService';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED';
const label = (s: string | null) => (s ? s.replace(/_/g, ' ') : 'NOT MARKED');
const REQUESTER: Record<string, string> = { STUDENT: 'Student', PARENT: 'Parent' };

function CorrectionCard({ item, myUserId, onReview, busy }: {
  item: CorrectionRequest;
  myUserId: string | undefined;
  onReview: (decision: 'APPROVE' | 'REJECT', remarks?: string) => void;
  busy: boolean;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [remarks, setRemarks] = useState('');
  const name = item.student ? `${item.student.firstName} ${item.student.lastName}`.trim() : 'Student';
  const mine = item.requestedById === myUserId;
  const s = item.session;
  const who = item.requestedByRole ? REQUESTER[item.requestedByRole] ?? ROLE_LABELS[item.requestedByRole] ?? item.requestedByRole : null;

  return (
    <View style={[styles.card, item.status === 'PENDING' && !mine && styles.cardActionable]}>
      <View style={styles.top}>
        <Avatar name={name} size={42} />
        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {[item.student?.rollNumber ? `Roll ${item.student.rollNumber}` : null, s?.section?.name].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {item.status !== 'PENDING' ? <Chip label={item.status} tone={statusTone(item.status)} /> : null}
      </View>

      <View style={styles.session}>
        <Icon name="event-note" size={16} color={colors.textSecondary} />
        <Text style={styles.sessionText} numberOfLines={1}>
          {[s ? shortDate(s.date) : null, s?.periodNumber ? `Period ${s.periodNumber}` : null, s?.subject?.name].filter(Boolean).join(' · ')}
        </Text>
      </View>

      <View style={styles.change}>
        <Chip label={label(item.oldStatus)} tone={item.oldStatus ? statusTone(item.oldStatus) : 'neutral'} />
        <Icon name="arrow-forward" size={18} color={colors.textSecondary} style={styles.arrow} />
        <Chip label={label(item.newStatus)} tone={statusTone(item.newStatus)} />
      </View>

      <Text style={styles.reason}>“{item.reason}”</Text>
      <Text style={styles.by}>
        {who ? `Requested by ${mine ? 'you' : who}` : mine ? 'Requested by you' : 'Requested'} · {timeAgo(item.createdAt)}
      </Text>
      {item.reviewRemarks ? <Text style={styles.remarks}>Reviewer: {item.reviewRemarks}</Text> : null}

      {item.status === 'PENDING' ? (
        mine ? (
          <Text style={styles.note}>Someone else must review your own request.</Text>
        ) : rejecting ? (
          <View>
            <TextInput
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Why is this not approved? (required)"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              multiline
              autoFocus
            />
            <View style={styles.actions}>
              <Button label="Back" variant="secondary" onPress={() => setRejecting(false)} disabled={busy} style={styles.actionBtn} />
              <Button label="Reject" variant="danger" icon="close" onPress={() => onReview('REJECT', remarks.trim())} disabled={!remarks.trim()} loading={busy} style={styles.actionBtn} />
            </View>
          </View>
        ) : (
          <View style={styles.actions}>
            <Button label="Reject" variant="danger" icon="close" onPress={() => setRejecting(true)} disabled={busy} style={styles.actionBtn} />
            <Button label="Approve" icon="check" color={colors.success} onPress={() => onReview('APPROVE')} loading={busy} style={styles.actionBtn} />
          </View>
        )
      ) : null}
    </View>
  );
}

/** Attendance correction requests (from teachers, students and parents) — reviewers only. */
export function AttendanceCorrectionsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>('PENDING');
  const query = useQuery({ queryKey: [...queryKeys.corrections, status], queryFn: () => fetchCorrections(status) });

  const review = useMutation({
    mutationFn: ({ id, decision, remarks }: { id: string; decision: 'APPROVE' | 'REJECT'; remarks?: string }) => reviewCorrection(id, decision, remarks),
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.corrections });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardAll });
      if (v.decision === 'APPROVE') Alert.alert('Correction applied', 'The attendance record has been updated.');
    },
    onError: (err: any) => Alert.alert('Not saved', err?.response?.data?.message || 'Could not save the review.'),
  });

  const tabs = (
    <View style={styles.tabs}>
      {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((t) => (
        <TouchableOpacity key={t} onPress={() => setStatus(t)} style={[styles.tab, status === t && styles.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: status === t }}>
          <Text style={[styles.tabText, status === t && styles.tabTextOn]}>{t.charAt(0) + t.slice(1).toLowerCase()}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (query.isError) return <ErrorView onRetry={query.refetch} />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={query.data ?? []}
      keyExtractor={(i) => i.id}
      refreshing={query.isRefetching}
      onRefresh={query.refetch}
      ListHeaderComponent={tabs}
      ListEmptyComponent={
        query.isLoading ? (
          <LoadingView />
        ) : (
          <EmptyView
            icon="rule"
            title={status === 'PENDING' ? 'Nothing to review' : `No ${status.toLowerCase()} corrections`}
            message={status === 'PENDING' ? 'Correction requests from teachers, students and parents appear here.' : undefined}
          />
        )
      }
      renderItem={({ item }) => (
        <CorrectionCard
          item={item}
          myUserId={user?.id}
          busy={review.isPending && review.variables?.id === item.id}
          onReview={(decision, remarks) => review.mutate({ id: item.id, decision, remarks })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1, marginHorizontal: spacing.sm + 2 },
  list: { padding: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.full, padding: 4, marginBottom: spacing.md, ...shadow(1) },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm + 2, borderRadius: radius.full },
  tabOn: { backgroundColor: colors.primary },
  tabText: { fontWeight: '700', color: colors.textSecondary, fontSize: 13 },
  tabTextOn: { color: '#fff' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm + 4, ...shadow(1) },
  cardActionable: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  top: { flexDirection: 'row', alignItems: 'center' },
  name: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  session: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  sessionText: { ...typography.caption, fontWeight: '700', color: colors.textSecondary, marginLeft: spacing.xs, flex: 1 },
  change: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  arrow: { marginHorizontal: spacing.sm },
  reason: { ...typography.body, color: colors.textPrimary, marginTop: spacing.sm, fontStyle: 'italic' },
  by: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  remarks: { ...typography.caption, color: colors.textPrimary, marginTop: spacing.xs, fontWeight: '600' },
  note: { ...typography.caption, color: colors.textSecondary, fontStyle: 'italic', marginTop: spacing.sm },
  input: {
    minHeight: 64,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm + 2,
    marginTop: spacing.md,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    ...typography.body,
  },
  actions: { flexDirection: 'row', marginTop: spacing.md, marginHorizontal: -spacing.xs },
  actionBtn: { flex: 1, marginHorizontal: spacing.xs, height: 46 },
});
