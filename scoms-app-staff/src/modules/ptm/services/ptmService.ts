import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

interface StudentRef {
  firstName: string;
  lastName: string;
  rollNumber: string;
  section: { name: string } | null;
}

export interface PtmNote {
  id: string;
  studentId: string;
  parentName: string | null;
  discussionNotes: string;
  meetingDate: string;
  createdAt: string;
  student: StudentRef | null;
}

export interface PtmStudent {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  section: { id: string; name: string } | null;
}

export async function fetchPtmNotes(): Promise<PtmNote[]> {
  const { data } = await apiClient.get<ApiEnvelope<PtmNote[]>>('/parent-meetings');
  return data.data ?? [];
}

/** Students in classes I teach — the only ones a note can be logged for. */
export async function fetchPtmStudents(): Promise<PtmStudent[]> {
  const { data } = await apiClient.get<ApiEnvelope<PtmStudent[]>>('/parent-meetings/students');
  return data.data ?? [];
}

export async function createPtmNote(payload: { studentId: string; parentName?: string; discussionNotes: string; meetingDate: string }) {
  const { data } = await apiClient.post<ApiEnvelope<PtmNote>>('/parent-meetings', payload);
  return data.data;
}
