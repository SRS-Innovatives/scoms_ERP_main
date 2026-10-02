import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface ExamScheduleItem {
  id: string;
  examDate: string;
  subject: { name: string; code: string };
  exam: { name: string; examType: string; status: string };
}

export async function fetchExamSchedule(): Promise<ExamScheduleItem[]> {
  const { data } = await apiClient.get<ApiEnvelope<ExamScheduleItem[]>>('/exams/schedule');
  return data.data;
}

export interface ExamResultItem {
  id: string;
  marksObtained: number;
  grade: string;
  isAbsent: boolean;
  examSchedule: {
    maxMarks: number;
    passMarks: number;
    publishedAt: string;
    subject: { name: string; code: string };
    exam: { name: string; examType: string };
  };
}

export async function fetchExamResults(): Promise<ExamResultItem[]> {
  const { data } = await apiClient.get<ApiEnvelope<ExamResultItem[]>>('/exams/results');
  return data.data;
}
