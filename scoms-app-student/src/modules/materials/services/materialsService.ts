import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

/** GET /materials — the student's (or active child's) subjects only, newest first. */
export interface StudyMaterial {
  id: string;
  title: string;
  description: string | null;
  fileType: string; // PDF, PPT, DOC, VIDEO, LINK
  /** signed link for an uploaded file, or the external link the teacher shared */
  fileUrl: string | null;
  createdAt: string;
  subject: { name: string } | null;
  staff: { firstName: string; lastName: string } | null;
}

export async function fetchMaterials(): Promise<StudyMaterial[]> {
  const { data } = await apiClient.get<ApiEnvelope<StudyMaterial[]>>('/materials');
  return data.data ?? [];
}

/** Tells the teacher's Download History this student opened it (parents aren't counted). */
export async function markMaterialOpened(id: string): Promise<void> {
  await apiClient.post(`/materials/${id}/opened`);
}
