import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { LeaveRequest, LeaveType, applyLeave, fetchLeaveTypes, fetchMyLeaves } from '../services/leaveService';

function ApplyLeaveForm({ onDone }: { onDone: () => void }) {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLeaveTypes().then((list) => {
      setTypes(list);
      if (list.length) setType(list[0].code);
    });
  }, []);

  const submit = async () => {
    if (!type || !startDate || !endDate || !reason) {
      Alert.alert('Missing details', 'Please pick a leave type, dates, and a reason.');
      return;
    }
    setSubmitting(true);
    try {
      await applyLeave({ type, startDate, endDate, reason });
      onDone();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.content}>
      <Text style={styles.label}>Leave Type</Text>
      <View style={styles.chipsRow}>
        {types.map((t) => (
          <TouchableOpacity key={t.code} onPress={() => setType(t.code)}>
            <Text style={[styles.chip, type === t.code && styles.chipActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextField label="From (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />
      <TextField label="To (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} />
      <TextField label="Reason" value={reason} onChangeText={setReason} multiline />
      <Button label="Submit" onPress={submit} loading={submitting} disabled={!type || !startDate || !endDate || !reason} />
      <Text style={styles.cancel} onPress={onDone}>Cancel</Text>
    </View>
  );
}

export function LeaveScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['staff', 'leaves'],
    queryFn: fetchMyLeaves,
  });

  if (showForm) {
    return (
      <ApplyLeaveForm
        onDone={() => {
          setShowForm(false);
          queryClient.invalidateQueries({ queryKey: ['staff', 'leaves'] });
        }}
      />
    );
  }

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorView onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <Button label="Apply for Leave" onPress={() => setShowForm(true)} style={styles.applyButton} />
      {!data?.length ? (
        <EmptyView title="No leave requests yet" />
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={data}
          keyExtractor={(item: LeaveRequest) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={styles.title}>
                {new Date(item.startDate).toLocaleDateString()} → {new Date(item.endDate).toLocaleDateString()}
              </Text>
              <Text style={styles.meta}>{item.type} · {item.reason}</Text>
              <Text style={[styles.status, item.status === 'APPROVED' && styles.approved, item.status === 'REJECTED' && styles.rejected]}>
                {item.status}
              </Text>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  applyButton: { margin: spacing.md },
  card: { marginBottom: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  status: { ...typography.caption, color: colors.warning, fontWeight: '700', marginTop: spacing.xs },
  approved: { color: colors.success },
  rejected: { color: colors.danger },
  cancel: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    ...typography.caption,
    color: colors.textSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipActive: { color: '#fff', backgroundColor: colors.primary, borderColor: colors.primary },
});
