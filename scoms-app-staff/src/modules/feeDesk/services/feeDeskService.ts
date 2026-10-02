import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface PendingFeeAssignment {
  id: string;
  studentId: string;
  dueAmount: number;
  status: string;
  student: { firstName: string; lastName: string; rollNumber: string; course?: { name: string } };
  feeStructure: { name: string; dueDate: string };
}

export async function fetchPendingFees(): Promise<PendingFeeAssignment[]> {
  const { data } = await apiClient.get<ApiEnvelope<PendingFeeAssignment[]>>('/fee-desk/pending');
  return data.data;
}

export type PaymentMode = 'CASH' | 'CHEQUE' | 'DD' | 'BANK_TRANSFER' | 'UPI_MANUAL' | 'OTHER';

export interface CollectOfflineFeePayload {
  studentId: string;
  studentFeeAssignmentId: string;
  amountPaid: number;
  paymentMode: PaymentMode;
  transactionReference?: string;
  remarks?: string;
}

export async function collectOfflineFee(payload: CollectOfflineFeePayload) {
  const { data } = await apiClient.post<ApiEnvelope<any>>('/fee-desk/collect', payload);
  return data.data;
}
