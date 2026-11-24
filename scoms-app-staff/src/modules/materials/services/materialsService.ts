import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export type MaterialType = 'PDF' | 'PPT' | 'DOC' | 'VIDEO' | 'LINK';
export const MATERIAL_TYPES: MaterialType[] = ['LINK', 'PDF', 'VIDEO', 'PPT', 'DOC'];

/** GET /materials — the institution's shared library (everyone's). */
export interface Material {
  id: string;
  staffId: string;
  title: string;
  description: string | null;
  fileType: MaterialType | string;
  /** an external link, a signed link for an uploaded file, or null */
  fileUrl: string | null;
  createdAt: string;
  subject: { name: string } | null;
  staff: { firstName: string; lastName: string } | null;
}

/** GET /materials/download-history — MY materials with how many students opened each. */
export interface MyMaterialStats {
  id: string;
  title: string;
  fileType: string;
  subject: string | null;
  sharedAt: string;
  students: number | null;
  openedBy: number;
  totalOpens: number;
  lastOpenedAt: string | null;
}

interface StudentRow {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  section: { name: string } | null;
}

export interface MaterialDownloads {
  material: { id: string; title: string; subject: string | null; sharedAt: string };
  opened: (StudentRow & { openCount: number; lastOpenedAt: string })[];
  notOpened: StudentRow[];
}

export async function fetchMaterials(): Promise<Material[]> {
  const { data } = await apiClient.get<ApiEnvelope<Material[]>>('/materials');
  return data.data ?? [];
}

export async function fetchMyMaterialStats(): Promise<MyMaterialStats[]> {
  const { data } = await apiClient.get<ApiEnvelope<MyMaterialStats[]>>('/materials/download-history');
  return data.data ?? [];
}

export async function fetchMaterialDownloads(id: string): Promise<MaterialDownloads> {
  const { data } = await apiClient.get<ApiEnvelope<MaterialDownloads>>(`/materials/${id}/downloads`);
  return data.data;
}

export async function fetchMySubjects(): Promise<{ id: string; name: string }[]> {
  const { data } = await apiClient.get<ApiEnvelope<{ id: string; name: string }[]>>('/materials/my-subjects');
  return data.data ?? [];
}

export async function shareMaterial(payload: { title: string; description?: string; subjectId: string; fileType: MaterialType; fileUrl: string }) {
  const { data } = await apiClient.post<ApiEnvelope<Material>>('/materials', payload);
  return data.data;
}

export async function deleteMaterial(id: string) {
  await apiClient.delete(`/materials/${id}`);
}
