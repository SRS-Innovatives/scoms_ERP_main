import React, { useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, moduleColor, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { Chip, statusTone } from '../../../components/Chip';
import { DateStrip } from '../../../components/DateStrip';
import { queryKeys } from '../../../services/api/queryKeys';
import { addDays, fromYmd, shortDate, startOfToday, ymd } from '../../../utils/dates';
import { LeaveRequest, LeaveType, applyLeave, fetchLeaveTypes, fetchMyLeaves } from '../services/leaveService';

const MAX_DAYS = 30;

function ApplyLeaveForm({ types, onDone, onCancel }: { types: LeaveType[]; onDone: () => void; onCancel: () => void }) {
  const [type, setType] = useState(types[0]?.code ?? '');
  const [start, setStart] = useState(ymd(startOfToday()));
  const [days, setDays] = useState(1);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const end = ymd(addDays(fromYmd(start), days - 1));

  const submit = async () => {
    if (!type || !reason.trim()) {
      Alert.alert('Missing details', 'Please pick a leave type and give a reason.');
      return;
    }
    setSubmitting(true);
    try {
      await applyLeave({ type, startDate: start, endDate: end, reason: reason.trim() });
      Alert.alert('Leave requested', `${days} day${days > 1 ? 's' : ''} from ${shortDate(fromYmd(start))}. You'll be notified when it's reviewed.`);
      onDone();
    } catch (err: any) {
      Alert.alert('Not submitted', err?.response?.data?.message || 'Could not submit the leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Leave type</Text>
        <View style={styles.chipsRow}>
          {types.map((t) => (
            <Chip key={t.code} label={t.label} selected={type === t.code} onPress={() => setType(t.code)} style={styles.chip} />
          ))}
        </View>

        <Text style={styles.label}>Starting</Text>
        <DateStrip value={start} onChange={setStart} />

        <Text style={[styles.label, styles.gapTop]}>How many days?</Text>
        <View style={styles.stepperRow}>
          <View style={styles.stepper}>
            <TouchableOpacity onPress={() => setDays((d) => Math.max(1, d - 1))} style={styles.stepBtn} accessibilityLabel="One day less" disabled={days <= 1}>
              <Icon name="remove" size={22} color={days <= 1 ? colors.disabled : colors.primary} />
            </TouchableOpacity>
            <Text style={styles.stepValue}>{days}</Text>
            <TouchableOpacity onPress={() => setDays((d) => Math.min(MAX_DAYS, d + 1))} style={styles.stepBtn} accessibilityLabel="One day more" disabled={days >= MAX_DAYS}>
              <Icon name="add" size={22} color={days >= MAX_DAYS ? colors.disabled : colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.range}>
            {days === 1 ? shortDate(fromYmd(start)) : `${shortDate(fromYmd(start))} → ${shortDate(fromYmd(end))}`}
          </Text>
        </View>

        <TextField label="Reason" icon="edit-note" value={reason} onChangeText={setReason} multiline maxLength={1000} placeholder="e.g. Medical appointment" />
        <Button label="Submit request" icon="send" onPress={submit} loading={submitting} disabled={!type || !reason.trim()} />
        <Button label="Cancel" variant="secondary" onPress={onCancel} style={styles.gapTop} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function LeaveScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const leavesQuery = useQuery({ queryKey: queryKeys.leavesAll, queryFn: fetchMyLeaves });
  const typesQuery = useQuery({ queryKey: [...queryKeys.leavesAll, 'types'], queryFn: fetchLeaveTypes, staleTime: 30 * 60_000 });

  if (showForm && typesQuery.data) {
    return (
      <ApplyLeaveForm
        types={typesQuery.data}
        onCancel={() => setShowForm(false)}
        onDone={() => {
          setShowForm(false);
          queryClient.invalidateQueries({ queryKey: queryKeys.leavesAll });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardAll }); // dashboard: pending leave
        }}
      />
    );
  }

  if (leavesQuery.isLoading) return <LoadingView />;
  if (leavesQuery.isError) return <ErrorView onRetry={leavesQuery.refetch} />;

  const leaves = leavesQuery.data ?? [];
  const count = (s: LeaveRequest['status']) => leaves.filter((l) => l.status === s).length;
  const typeLabel = (code: string) => typesQuery.data?.find((t) => t.code === code)?.label ?? code;
  const accent = moduleColor('leave');

  const header = (
    <View>
      <View style={styles.statsRow}>
        {([
          ['PENDING', 'Pending', colors.warning, colors.warningLight],
          ['APPROVED', 'Approved', colors.success, colors.successLight],
          ['REJECTED', 'Rejected', colors.danger, colors.dangerLight],
        ] as const).map(([key, label, fg, bg]) => (
          <View key={key} style={[styles.stat, { backgroundColor: bg }]}>
            <Text style={[styles.statValue, { color: fg }]}>{count(key)}</Text>
            <Text style={[styles.statLabel, { color: fg }]}>{label}</Text>
          </View>
        ))}
      </View>
      <Button
        label="Apply for leave"
        icon="add-circle-outline"
        onPress={() => setShowForm(true)}
        loading={typesQuery.isLoading}
        disabled={!typesQuery.data?.length}
        style={styles.applyButton}
      />
      {typesQuery.isError ? <Text style={styles.warn}>Leave types couldn't be loaded — pull to retry.</Text> : null}
      {leaves.length ? <Text style={styles.historyTitle}>History</Text> : null}
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={leaves}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyView icon="event-available" title="No leave requests yet" message="Requests you make appear here with their status." />}
      refreshing={leavesQuery.isRefetching}
      onRefresh={() => {
        leavesQuery.refetch();
        typesQuery.refetch();
      }}
      renderItem={({ item }) => {
        const sameDay = item.startDate.slice(0, 10) === item.endDate.slice(0, 10);
        return (
          <View style={styles.card}>
            <View style={[styles.cardIcon, { backgroundColor: accent.soft }]}>
              <Icon name="event" size={22} color={accent.solid} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>
                {sameDay ? shortDate(item.startDate) : `${shortDate(item.startDate)} → ${shortDate(item.endDate)}`}
              </Text>
              <Text style={styles.cardMeta} numberOfLines={2}>
                {typeLabel(item.type)} · {item.reason}
              </Text>
            </View>
            <Chip label={item.status} tone={statusTone(item.status)} />
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  list: { padding: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 },
  form: { padding: spacing.md, paddingBottom: spacing.xl },
  statsRow: { flexDirection: 'row', marginHorizontal: -3 },
  stat: { flex: 1, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center', marginHorizontal: 3 },
  statValue: { ...typography.h1 },
  statLabel: { ...typography.caption, fontWeight: '700' },
  applyButton: { marginTop: spacing.md },
  warn: { ...typography.caption, color: colors.danger, marginTop: spacing.xs, textAlign: 'center' },
  historyTitle: { ...typography.h3, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow(1),
  },
  cardIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  cardTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  cardMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2, marginRight: spacing.sm },
  label: { ...typography.caption, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  gapTop: { marginTop: spacing.md },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  chip: { marginRight: spacing.sm, marginBottom: spacing.sm, paddingVertical: 7, paddingHorizontal: spacing.md },
  stepperRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.full, ...shadow(1) },
  stepBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepValue: { ...typography.h2, color: colors.textPrimary, minWidth: 32, textAlign: 'center' },
  range: { ...typography.body, fontWeight: '600', color: colors.textSecondary, marginLeft: spacing.md, flex: 1 },
});
