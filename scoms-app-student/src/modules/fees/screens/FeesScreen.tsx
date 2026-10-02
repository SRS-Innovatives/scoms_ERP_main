import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import RazorpayCheckout from 'react-native-razorpay';
import { colors, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { useAuth } from '../../../store/AuthContext';
import {
  StudentFeeAssignment,
  fetchFeesOverview,
  initiateOnlinePayment,
  verifyOnlinePayment,
} from '../services/feesService';

/**
 * "Pay Now" never marks a fee paid itself — /fees/pay/verify on the backend, which
 * independently re-checks the Razorpay HMAC signature, is the only source of truth.
 * When the backend is running in simulated-gateway mode (no real Razorpay keys — the
 * default), it hands back an already-valid payment id/signature pair with nothing
 * for a checkout UI to actually do, so this screen verifies immediately instead of
 * opening a widget; once real keys are configured, the exact same code opens the
 * real Razorpay Checkout SDK and waits for its result. See
 * Student_module_frontend/src/pages/fees/PayFeesPage.jsx for the same logic on web.
 */
export function FeesScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['fees', 'overview'],
    queryFn: fetchFeesOverview,
  });

  const [selected, setSelected] = useState<StudentFeeAssignment | null>(null);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  if (isLoading) return <LoadingView />;
  if (isError || !data) return <ErrorView onRetry={refetch} />;

  const dueAssignments = data.filter((a) => a.dueAmount > 0);

  const openPayment = (assignment: StudentFeeAssignment) => {
    setSelected(assignment);
    setAmount(String(assignment.dueAmount));
  };

  const finishPayment = async (order: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    if (!selected) return;
    try {
      const result = await verifyOnlinePayment({
        studentFeeAssignmentId: selected.id,
        amountPaid: Number(amount),
        ...order,
      });
      Alert.alert(
        'Payment Successful',
        `₹${Number(amount).toLocaleString()} received — Receipt ${result.receipt.receiptNumber}`,
      );
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ['fees'] });
    } catch (err: any) {
      Alert.alert('Payment Failed', err?.response?.data?.message || 'Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = async () => {
    if (!selected || !amount || Number(amount) <= 0 || Number(amount) > selected.dueAmount) return;
    setProcessing(true);
    try {
      const order = await initiateOnlinePayment(selected.id, Number(amount));

      if (!order.simulated) {
        const student = user?.student;
        const checkoutResult = await RazorpayCheckout.open({
          key: order.key,
          amount: Math.round(Number(amount) * 100),
          currency: order.currency || 'INR',
          name: 'SCOMS Fee Payment',
          description: selected.feeStructure?.name || 'Fee Payment',
          order_id: order.orderId,
          prefill: {
            name: student ? `${student.firstName} ${student.lastName}` : undefined,
            email: user?.email || undefined,
            contact: user?.mobile || undefined,
          },
          theme: { color: colors.primary },
        });
        await finishPayment({
          razorpayOrderId: checkoutResult.razorpay_order_id,
          razorpayPaymentId: checkoutResult.razorpay_payment_id,
          razorpaySignature: checkoutResult.razorpay_signature,
        });
        return;
      }

      // Simulated gateway: the backend already precomputed a valid payment id +
      // signature pair, so verify immediately — no real checkout UI to open.
      await finishPayment({
        razorpayOrderId: order.orderId,
        razorpayPaymentId: order.paymentId!,
        razorpaySignature: order.signature!,
      });
    } catch (err: any) {
      if (err?.code !== 0) {
        // code 0 is RazorpayCheckout's own "user dismissed the widget" — not a real error
        Alert.alert('Payment Failed', err?.description || err?.response?.data?.message || 'Please try again.');
      }
      setProcessing(false);
    }
  };

  if (selected) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{selected.feeStructure?.name}</Text>
          <Text style={styles.meta}>Outstanding: ₹{selected.dueAmount.toLocaleString()}</Text>

          <TextField
            label="Amount to pay"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          <Button
            label={processing ? 'Processing...' : `Pay ₹${Number(amount || 0).toLocaleString()}`}
            onPress={handlePay}
            loading={processing}
            disabled={!amount || Number(amount) <= 0 || Number(amount) > selected.dueAmount}
          />
          <Text style={styles.cancel} onPress={() => setSelected(null)}>
            Cancel
          </Text>
        </View>
      </View>
    );
  }

  if (!dueAssignments.length) {
    return <EmptyView title="No pending fees" message="You're all caught up!" />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {dueAssignments.map((assignment) => (
        <Card key={assignment.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>{assignment.feeStructure?.name}</Text>
            <Text style={[styles.value, { color: colors.danger }]}>₹{assignment.dueAmount.toLocaleString()}</Text>
          </View>
          {assignment.feeStructure?.dueDate ? (
            <Text style={styles.due}>Due {new Date(assignment.feeStructure.dueDate).toLocaleDateString()}</Text>
          ) : null}
          <Button label="Pay Now" onPress={() => openPayment(assignment)} style={styles.payButton} />
        </Card>
      ))}

      <TouchableOpacity onPress={() => refetch()}>
        <Text style={styles.link}>View payment history</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  label: { ...typography.body, color: colors.textSecondary },
  value: { ...typography.h3 },
  due: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  payButton: { marginTop: spacing.sm },
  title: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xs },
  meta: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  cancel: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
  link: { color: colors.primary, textAlign: 'center', marginTop: spacing.sm, ...typography.body },
});
