import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface SubjectAttendance {
  subject: string;
  total: number;
  present: number;
  percentage: number;
}

export interface AttendanceSummary {
  percentage: number;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  subjectBreakdown: SubjectAttendance[];
}

export async function fetchAttendanceSummary(): Promise<AttendanceSummary> {
  const { data } = await apiClient.get<ApiEnvelope<AttendanceSummary>>('/attendance');
  return data.data;
}
