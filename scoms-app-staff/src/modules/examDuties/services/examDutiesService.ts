import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface ExamDuty {
  id: string;
  role: string;
  roleLabel: string;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  subjectCode: string;
  className: string;
  room: string | null;
  remarks: string | null;
  upcoming: boolean;
}

export interface ExamDutyGroup {
  exam: { id: string; name: string; examType: string; startDate: string; endDate: string };
  duties: ExamDuty[];
}

/** GET /exam-duties/mine — duties the Institute Admin allotted to me, grouped by exam. */
export async function fetchMyExamDuties(): Promise<ExamDutyGroup[]> {
  const { data } = await apiClient.get<ApiEnvelope<{ exams: ExamDutyGroup[] }>>('/exam-duties/mine');
  return data.data?.exams ?? [];
}
