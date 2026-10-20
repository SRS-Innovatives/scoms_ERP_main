import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface ExamSetupItem {
  id: string;
  name: string;
  examType: string;
  status: string;
  startDate: string;
  endDate: string;
  academicYear: { yearName: string };
  _count: { schedules: number };
}

export async function fetchExams(): Promise<ExamSetupItem[]> {
  const { data } = await apiClient.get<ApiEnvelope<ExamSetupItem[]>>('/exam-setup/exams');
  return data.data;
}

export interface AcademicYear {
  id: string;
  yearName: string;
  isCurrent: boolean;
}

export async function fetchAcademicYears(): Promise<AcademicYear[]> {
  const { data } = await apiClient.get<ApiEnvelope<AcademicYear[]>>('/exam-setup/academic-years');
  return data.data;
}

export const EXAM_TYPES = ['UNIT_TEST', 'MID_TERM', 'FINAL'] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

export interface CreateExamPayload {
  name: string;
  examType: ExamType;
  academicYearId: string;
  startDate: string;
  endDate: string;
}

export async function createExam(payload: CreateExamPayload) {
  const { data } = await apiClient.post<ApiEnvelope<ExamSetupItem>>('/exam-setup/exams', payload);
  return data.data;
}
