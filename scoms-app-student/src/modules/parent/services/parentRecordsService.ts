import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

/** Student_Backend parentRecordsController — parent-only, about the active child. */

export interface DisciplineRecord {
  id: string;
  incidentDate: string;
  category: 'MINOR' | 'MAJOR' | 'SEVERE' | string;
  description: string;
  actionTaken: string | null;
  status: 'OPEN' | 'RESOLVED' | string;
  reportedBy: string | null;
  reportedByDesignation: string | null;
}

export interface HealthRecord {
  id: string;
  visitDate: string;
  symptoms: string | null;
  diagnosis: string | null;
  actionTaken: string | null;
  referredToHospital: boolean;
  parentNotified: boolean;
  recordedBy: string | null;
}

export interface PtmNote {
  id: string;
  meetingDate: string;
  parentName: string | null;
  discussionNotes: string;
  teacher: string | null;
  teacherDesignation: string | null;
}

export async function fetchDisciplineRecords(): Promise<DisciplineRecord[]> {
  const { data } = await apiClient.get<ApiEnvelope<DisciplineRecord[]>>('/discipline');
  return data.data ?? [];
}

export async function fetchHealthRecords(): Promise<HealthRecord[]> {
  const { data } = await apiClient.get<ApiEnvelope<HealthRecord[]>>('/health-records');
  return data.data ?? [];
}

export async function fetchPtmNotes(): Promise<PtmNote[]> {
  const { data } = await apiClient.get<ApiEnvelope<PtmNote[]>>('/ptm-notes');
  return data.data ?? [];
}
