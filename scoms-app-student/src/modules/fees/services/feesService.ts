import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface FeeStructure {
  id: string;
  name: string;
  dueDate: string;
}

export interface FeeReceipt {
  id: string;
  receiptNumber: string;
  amount: number;
}

export interface FeePayment {
  id: string;
  amountPaid: number;
  paymentMode: string;
  paymentStatus: string;
  createdAt: string;
  receipt?: FeeReceipt | null;
}

export interface StudentFeeAssignment {
  id: string;
  totalAmount: number;
  discountAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  feeStructure: FeeStructure;
  payments: FeePayment[];
}

export async function fetchFeesOverview(): Promise<StudentFeeAssignment[]> {
  const { data } = await apiClient.get<ApiEnvelope<StudentFeeAssignment[]>>('/fees');
  return data.data;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
  simulated: boolean;
  paymentId?: string; // only present when simulated — the mock gateway's precomputed pair
  signature?: string;
  orderToken: string; // the server's signed record of this order's fee + amount — sent back on verify
}

export async function initiateOnlinePayment(studentFeeAssignmentId: string, amount: number): Promise<PaymentOrder> {
  const { data } = await apiClient.post<ApiEnvelope<PaymentOrder>>('/fees/pay/initiate', {
    studentFeeAssignmentId,
    amount,
  });
  return data.data;
}

export interface VerifyPaymentPayload {
  studentFeeAssignmentId: string;
  orderToken: string; // the server credits the amount fixed in this token, not one sent by the app
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export async function verifyOnlinePayment(payload: VerifyPaymentPayload) {
  const { data } = await apiClient.post<ApiEnvelope<{ receipt: FeeReceipt }>>('/fees/pay/verify', payload);
  return data.data;
}
