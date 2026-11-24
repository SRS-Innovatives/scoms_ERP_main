import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

/** GET /parent/children — Student_Backend parentController.getMyChildren */
export interface LinkedChild {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string | null;
  rollNumber: string | null;
  course: { name: string } | null;
  section: { name: string } | null;
  relation: string | null;
}

export async function fetchMyChildren(): Promise<LinkedChild[]> {
  const { data } = await apiClient.get<ApiEnvelope<LinkedChild[]>>('/parent/children');
  return data.data ?? [];
}

export const childName = (c: Pick<LinkedChild, 'firstName' | 'lastName'>) => `${c.firstName} ${c.lastName ?? ''}`.trim();

export const childClassLabel = (c: Pick<LinkedChild, 'course' | 'section'>) =>
  [c.course?.name, c.section?.name].filter(Boolean).join(' · ');

/** GET /parent/profile — the parent's own record. Names/income are read-only (set by the
 * institution); login identity (loginEmail/loginMobile) can't be changed from the app. */
export interface ParentProfile {
  id: string;
  fatherName: string | null;
  fatherOccupation: string | null;
  fatherPhone: string | null;
  fatherEmail: string | null;
  motherName: string | null;
  motherOccupation: string | null;
  motherPhone: string | null;
  motherEmail: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianRelation: string | null;
  address: string | null;
  loginEmail: string | null;
  loginMobile: string | null;
  userCode: string | null;
  updatedAt: string;
}

/** Must match Student_Backend parentController PARENT_EDITABLE_FIELDS */
export const PARENT_EDITABLE_FIELDS = [
  'fatherPhone', 'fatherEmail', 'fatherOccupation',
  'motherPhone', 'motherEmail', 'motherOccupation',
  'guardianName', 'guardianPhone', 'guardianRelation',
  'address',
] as const;
export type ParentEditableField = (typeof PARENT_EDITABLE_FIELDS)[number];
export type ParentProfileUpdate = Partial<Record<ParentEditableField, string | null>>;

export async function fetchParentProfile(): Promise<ParentProfile> {
  const { data } = await apiClient.get<ApiEnvelope<ParentProfile>>('/parent/profile');
  return data.data;
}

export async function updateParentProfile(changes: ParentProfileUpdate): Promise<ParentProfile> {
  const { data } = await apiClient.patch<ApiEnvelope<ParentProfile>>('/parent/profile', changes);
  return data.data;
}

/** The family's display name for headers: father, else mother, else guardian. */
export const parentDisplayName = (p: Pick<ParentProfile, 'fatherName' | 'motherName' | 'guardianName'> | null | undefined) =>
  p?.fatherName || p?.motherName || p?.guardianName || null;
