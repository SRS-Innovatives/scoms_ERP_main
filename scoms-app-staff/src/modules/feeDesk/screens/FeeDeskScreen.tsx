import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { PendingFeeAssignment, collectOfflineFee, fetchPendingFees } from '../services/feeDeskService';

export function FeeDeskScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['feeDesk', 'pending'],
    queryFn: fetchPendingFees,
  });

  const [selected, setSelected] = useState<PendingFeeAssignment | null>(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [collecting, setCollecting] = useState(false);

  const openCollect = (assignment: PendingFeeAssignment) => {
    setSelected(assignment);
    setAmount(String(assignment.dueAmount));
    setReference('');
  };

  const handleCollect = async () => {
    if (!selected || !amount || Number(amount) <= 0) return;
    setCollecting(true);
    try {
      await collectOfflineFee({
        studentId: selected.studentId,
        studentFeeAssignmentId: selected.id,
        amountPaid: Number(amount),
        paymentMode: 'CASH',
        transactionReference: reference || undefined,
      });
      Alert.alert('Collected', `₹${amount} recorded for ${selected.student.firstName} ${selected.student.lastName}`);
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ['feeDesk'] });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not record this payment.');
    } finally {
      setCollecting(false);
    }
  };

  if (selected) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{selected.student.firstName} {selected.student.lastName}</Text>
          <Text style={styles.meta}>{selected.feeStructure.name} — Due ₹{selected.dueAmount.toLocaleString()}</Text>

          <TextField label="Amount received (cash)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
          <TextField label="Reference / receipt note (optional)" value={reference} onChangeText={setReference} />

          <Button label="Record Payment" onPress={handleCollect} loading={collecting} />
          <Text style={styles.cancel} onPress={() => setSelected(null)}>Cancel</Text>
        </View>
      </View>
    );
  }

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorView onRetry={refetch} />;
  if (!data?.length) return <EmptyView title="No pending fees" message="Every assignment is fully paid." />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Text style={styles.title}>{item.student.firstName} {item.student.lastName}</Text>
          <Text style={styles.meta}>Roll {item.student.rollNumber} · {item.student.course?.name}</Text>
          <Text style={styles.meta}>{item.feeStructure.name}</Text>
          <View style={styles.row}>
            <Text style={[styles.due, { color: colors.danger }]}>₹{item.dueAmount.toLocaleString()} due</Text>
            <Button label="Collect" onPress={() => openCollect(item)} style={styles.collectButton} />
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  card: { marginBottom: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  due: { ...typography.body, fontWeight: '700' },
  collectButton: { height: 36, paddingHorizontal: spacing.md },
  cancel: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
});
