import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_DUTY' | string;

/** shared/attendance/attendanceRules.js listCorrectionRequests row. */
export interface CorrectionRequest {
  id: string;
  oldStatus: AttendanceStatus | null;
  newStatus: AttendanceStatus;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedById: string;
  /** STUDENT / PARENT when raised from the Student portal or app, else a staff role */
  requestedByRole: string | null;
  reviewRemarks: string | null;
  createdAt: string;
  student: { id: string; firstName: string; lastName: string; rollNumber: string } | null;
  session: { id: string; date: string; periodNumber: number | null; section: { name: string } | null; subject: { name: string } | null } | null;
}

/** GET /attendance-corrections?status= — reviewers (attendance.approve: HOD, Principal, VP). */
export async function fetchCorrections(status: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<CorrectionRequest[]> {
  const { data } = await apiClient.get<ApiEnvelope<CorrectionRequest[]>>('/attendance-corrections', { params: { status } });
  return data.data ?? [];
}

/** Remarks are required when rejecting. */
export async function reviewCorrection(id: string, decision: 'APPROVE' | 'REJECT', remarks?: string) {
  const { data } = await apiClient.post<ApiEnvelope<unknown>>(`/attendance-corrections/${id}/review`, { decision, remarks });
  return data.data;
}
