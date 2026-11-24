import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface LeaveType {
  code: string;
  label: string;
}

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | string;

export interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  hasAttachment: boolean;
  createdAt: string;
}

/** The institution's own leave types (Settings → Custom Lists, or the defaults). */
export async function fetchLeaveTypes(): Promise<LeaveType[]> {
  const { data } = await apiClient.get<ApiEnvelope<LeaveType[]>>('/leave/types');
  return data.data ?? [];
}

export async function fetchMyLeaves(): Promise<LeaveRequest[]> {
  const { data } = await apiClient.get<ApiEnvelope<LeaveRequest[]>>('/leave');
  return data.data ?? [];
}

/** Dates as YYYY-MM-DD. A parent applies for the active child (same endpoint). */
export async function applyLeave(payload: { type: string; startDate: string; endDate: string; reason: string }): Promise<LeaveRequest> {
  const { data } = await apiClient.post<ApiEnvelope<LeaveRequest>>('/leave', payload);
  return data.data;
}

/** Inclusive day count, same as the web portal. */
export const leaveDays = (start: string, end: string) =>
  Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1;
