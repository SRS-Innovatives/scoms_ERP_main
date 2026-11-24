import React, { useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, moduleColors, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { useParent } from '../../../store/ParentContext';
import { queryKeys } from '../../../services/api/queryKeys';
import { applyLeave, fetchLeaveTypes, fetchMyLeaves, LeaveRequest, LeaveType, leaveDays } from '../services/leaveService';

const tint = moduleColors.leave;
const DAYS_AHEAD = 45;
const MAX_DAYS = 30;

/** Local calendar date as YYYY-MM-DD (not toISOString — that shifts to UTC). */
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const pretty = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) => new Date(iso).toLocaleDateString(undefined, opts);

const STATUS: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  PENDING: { color: colors.warning, bg: colors.warningLight, icon: 'schedule', label: 'Pending' },
  APPROVED: { color: colors.success, bg: colors.successLight, icon: 'check-circle', label: 'Approved' },
  REJECTED: { color: colors.danger, bg: colors.dangerLight, icon: 'cancel', label: 'Rejected' },
  CANCELLED: { color: colors.textSecondary, bg: colors.surfaceMuted, icon: 'block', label: 'Cancelled' },
};

function ApplyForm({ types, onDone, onCancel }: { types: LeaveType[]; onDone: () => void; onCancel: () => void }) {
  const { isParent, activeChild } = useParent();
  const today = useMemo(() => new Date(), []);
  const dates = useMemo(() => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i)), [today]);
  const [type, setType] = useState(types[0]?.code ?? 'CASUAL');
  const [start, setStart] = useState(ymd(today));
  const [days, setDays] = useState(1);
  const [reason, setReason] = useState('');
  const end = ymd(addDays(new Date(`${start}T00:00:00`), days - 1));

  const mutation = useMutation({
    mutationFn: applyLeave,
    onSuccess: () => {
      Alert.alert('Leave requested', isParent ? `Sent to ${activeChild?.firstName ?? 'your child'}'s class teacher for approval.` : 'Sent to your class teacher for approval.');
      onDone();
    },
    onError: (err: any) => Alert.alert("Couldn't submit", err?.response?.data?.message || 'Please try again.'),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {isParent ? (
        <View style={styles.parentNote}>
          <Icon name="family-restroom" size={18} color={colors.parent} />
          <Text style={styles.parentNoteText}>Applying for {activeChild?.firstName ?? 'your child'}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>Type of leave</Text>
      <View style={styles.chips}>
        {types.map((t) => {
          const on = t.code === type;
          return (
            <TouchableOpacity key={t.code} onPress={() => setType(t.code)} style={[styles.chip, on && { backgroundColor: tint.solid, borderColor: tint.solid }]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>From</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
        {dates.map((d) => {
          const key = ymd(d);
          const on = key === start;
          return (
            <TouchableOpacity key={key} onPress={() => setStart(key)} style={[styles.dateChip, on && { backgroundColor: tint.solid }]} accessibilityLabel={d.toDateString()}>
              <Text style={[styles.dateDow, on && styles.chipTextOn]}>{d.toLocaleDateString(undefined, { weekday: 'short' })}</Text>
              <Text style={[styles.dateNum, on && styles.chipTextOn]}>{d.getDate()}</Text>
              <Text style={[styles.dateMon, on && styles.chipTextOn]}>{d.toLocaleDateString(undefined, { month: 'short' })}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.label}>Number of days</Text>
      <View style={styles.stepperRow}>
        <View style={styles.stepper}>
          <TouchableOpacity onPress={() => setDays((n) => Math.max(1, n - 1))} style={styles.stepBtn} accessibilityLabel="Fewer days">
            <Icon name="remove" size={22} color={tint.solid} />
          </TouchableOpacity>
          <Text style={styles.stepValue}>{days}</Text>
          <TouchableOpacity onPress={() => setDays((n) => Math.min(MAX_DAYS, n + 1))} style={styles.stepBtn} accessibilityLabel="More days">
            <Icon name="add" size={22} color={tint.solid} />
          </TouchableOpacity>
        </View>
        <Text style={styles.range}>
          {pretty(start, { weekday: 'short', day: 'numeric', month: 'short' })}
          {days > 1 ? `  →  ${pretty(end, { weekday: 'short', day: 'numeric', month: 'short' })}` : ''}
        </Text>
      </View>

      <TextField label="Reason" value={reason} onChangeText={setReason} multiline style={styles.reason} placeholder="e.g. Fever, family function…" maxLength={1000} />

      <Button
        label={`Request ${days} day${days === 1 ? '' : 's'}`}
        color={tint.solid}
        loading={mutation.isPending}
        disabled={!reason.trim()}
        onPress={() => mutation.mutate({ type, startDate: start, endDate: end, reason: reason.trim() })}
      />
      <Text style={styles.cancel} onPress={onCancel}>
        Cancel
      </Text>
    </ScrollView>
  );
}

export function LeaveScreen() {
  const queryClient = useQueryClient();
  const { isParent, activeChild } = useParent();
  const [applying, setApplying] = useState(false);
  const leavesQuery = useQuery({ queryKey: queryKeys.leave, queryFn: fetchMyLeaves });
  const typesQuery = useQuery({ queryKey: queryKeys.leaveTypes, queryFn: fetchLeaveTypes, staleTime: 30 * 60_000 });
  const labelOf = useMemo(() => new Map((typesQuery.data ?? []).map((t) => [t.code, t.label])), [typesQuery.data]);

  if (applying && typesQuery.data) {
    return (
      <ApplyForm
        types={typesQuery.data}
        onCancel={() => setApplying(false)}
        onDone={() => {
          setApplying(false);
          queryClient.invalidateQueries({ queryKey: queryKeys.leaveAll });
        }}
      />
    );
  }

  if (leavesQuery.isLoading) return <LoadingView />;
  if (leavesQuery.isError) return <ErrorView onRetry={leavesQuery.refetch} />;

  const leaves = leavesQuery.data ?? [];
  const count = (s: string) => leaves.filter((l) => l.status === s).length;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={leaves}
      keyExtractor={(l: LeaveRequest) => l.id}
      refreshControl={<RefreshControl refreshing={leavesQuery.isRefetching} onRefresh={() => { leavesQuery.refetch(); }} colors={[tint.solid]} />}
      ListHeaderComponent={
        <>
          <View style={[styles.hero, { backgroundColor: tint.solid }]}>
            <View style={styles.blob} />
            <Text style={styles.heroTitle}>{isParent ? `${activeChild?.firstName ?? 'Child'}'s leave` : 'My leave'}</Text>
            <View style={styles.heroStats}>
              {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
                <View key={s} style={styles.heroStat}>
                  <Text style={styles.heroValue}>{count(s)}</Text>
                  <Text style={styles.heroLabel}>{STATUS[s].label}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => setApplying(true)}
              disabled={!typesQuery.data}
              accessibilityRole="button"
            >
              <Icon name="add" size={20} color={tint.solid} />
              <Text style={[styles.applyText, { color: tint.solid }]}>Apply for leave</Text>
            </TouchableOpacity>
          </View>
          {leaves.length > 0 ? <Text style={styles.section}>History</Text> : null}
        </>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Icon name="event-available" size={40} color={tint.solid} />
          <Text style={styles.emptyTitle}>No leave requests yet</Text>
          <Text style={styles.emptyText}>Tap "Apply for leave" to send one to the class teacher.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const st = STATUS[item.status] ?? STATUS.CANCELLED;
        const n = leaveDays(item.startDate, item.endDate);
        return (
          <Card style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardType}>{labelOf.get(item.type) ?? item.type}</Text>
              <View style={[styles.status, { backgroundColor: st.bg }]}>
                <Icon name={st.icon} size={13} color={st.color} />
                <Text style={[styles.statusText, { color: st.color }]}>{st.label.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.dateRow}>
              <Icon name="date-range" size={16} color={colors.textSecondary} />
              <Text style={styles.dates}>
                {pretty(item.startDate)}
                {n > 1 ? ` – ${pretty(item.endDate)}` : ''} · {n} day{n === 1 ? '' : 's'}
              </Text>
            </View>
            <Text style={styles.reasonText} numberOfLines={3}>
              {item.reason}
            </Text>
            <Text style={styles.applied}>Applied {pretty(item.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  hero: { borderRadius: radius.xl, padding: spacing.md, overflow: 'hidden', marginBottom: spacing.md, ...shadow(2) },
  blob: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -70, right: -50, backgroundColor: 'rgba(255,255,255,0.14)' },
  heroTitle: { ...typography.h2, color: '#fff' },
  heroStats: { flexDirection: 'row', marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.lg, paddingVertical: spacing.sm },
  heroStat: { flex: 1, alignItems: 'center' },
  heroValue: { ...typography.h2, color: '#fff' },
  heroLabel: { ...typography.caption, fontSize: 11, color: colors.textOnDarkMuted, fontWeight: '600' },
  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: radius.md, paddingVertical: spacing.sm + 4, marginTop: spacing.md },
  applyText: { fontWeight: '800', fontSize: 15, marginLeft: 6 },
  section: { ...typography.overline, color: colors.textSecondary, marginBottom: spacing.sm, marginLeft: spacing.xs },
  card: { marginBottom: spacing.sm + 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardType: { ...typography.h3, color: colors.textPrimary, flex: 1 },
  status: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  statusText: { ...typography.overline, fontSize: 10, marginLeft: 3 },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  dates: { ...typography.body, color: colors.textPrimary, marginLeft: 6, fontWeight: '600' },
  reasonText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  applied: { ...typography.caption, fontSize: 11, color: colors.textSecondary, marginTop: spacing.sm },
  empty: { alignItems: 'center', padding: spacing.xl },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  parentNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.parentLight, borderRadius: radius.md, padding: spacing.sm + 4, marginBottom: spacing.md },
  parentNoteText: { ...typography.body, fontWeight: '700', color: colors.parentDark, marginLeft: spacing.sm },
  label: { ...typography.caption, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  chip: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.sm, marginBottom: spacing.sm },
  chipText: { fontWeight: '600', color: colors.textPrimary, fontSize: 13 },
  chipTextOn: { color: '#fff' },
  dateStrip: { paddingBottom: spacing.sm },
  dateChip: { width: 58, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: spacing.sm, marginRight: spacing.sm, ...shadow(1) },
  dateDow: { ...typography.caption, fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  dateNum: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  dateMon: { ...typography.caption, fontSize: 11, color: colors.textSecondary },
  stepperRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.full, ...shadow(1) },
  stepBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, minWidth: 28, textAlign: 'center' },
  range: { ...typography.body, fontWeight: '600', color: colors.textPrimary, marginLeft: spacing.md, flex: 1 },
  reason: { minHeight: 100, textAlignVertical: 'top' },
  cancel: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, padding: spacing.sm },
});
