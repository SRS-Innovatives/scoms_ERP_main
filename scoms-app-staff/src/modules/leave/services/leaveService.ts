import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface LeaveType {
  code: string;
  label: string;
}

export async function fetchLeaveTypes(): Promise<LeaveType[]> {
  const { data } = await apiClient.get<ApiEnvelope<LeaveType[]>>('/leave/types');
  return data.data;
}

export async function fetchMyLeaves(): Promise<LeaveRequest[]> {
  const { data } = await apiClient.get<ApiEnvelope<LeaveRequest[]>>('/leave');
  return data.data;
}

export async function applyLeave(payload: { type: string; startDate: string; endDate: string; reason: string }) {
  const { data } = await apiClient.post<ApiEnvelope<LeaveRequest>>('/leave', payload);
  return data.data;
}
