import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface ExamScheduleSummary {
  id: string;
  examDate: string;
  maxMarks: number;
  isPublished: boolean;
  markStatus?: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'APPROVED';
  reviewRemarks?: string | null;
  subject: { name: string; code: string };
  exam: { name: string; examType: string };
  _count: { studentMarks: number };
}

export async function fetchMySchedules(): Promise<ExamScheduleSummary[]> {
  const { data } = await apiClient.get<ApiEnvelope<ExamScheduleSummary[]>>('/exams/my-schedules');
  return data.data;
}

export interface RosterStudentMark {
  marksObtained: number;
  grade: string;
  isAbsent: boolean;
  remarks: string | null;
}

export interface RosterStudent {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  section: { name: string } | null;
  mark: RosterStudentMark | null;
}

export interface ExamRoster {
  schedule: ExamScheduleSummary & { courseId: string };
  roster: RosterStudent[];
}

export async function fetchExamRoster(scheduleId: string): Promise<ExamRoster> {
  const { data } = await apiClient.get<ApiEnvelope<ExamRoster>>(`/exam-schedules/${scheduleId}/roster`);
  return data.data;
}

export interface MarkRow {
  studentId: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks?: string;
}

export async function saveMarks(scheduleId: string, marks: MarkRow[]) {
  await apiClient.post(`/exam-schedules/${scheduleId}/marks`, { marks });
}

export async function submitMarks(scheduleId: string) {
  await apiClient.post(`/exam-schedules/${scheduleId}/submit`);
}

export async function publishMarks(scheduleId: string) {
  await apiClient.post(`/exam-schedules/${scheduleId}/publish`);
}
