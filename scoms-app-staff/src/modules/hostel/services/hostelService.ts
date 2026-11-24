import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface HostelBed {
  id: string;
  roomNumber: string;
  bedNumber: string;
  isOccupied: boolean;
  hostel: { name: string; type: string };
  student: { firstName: string; lastName: string; rollNumber: string } | null;
}

export type BedFilter = 'all' | 'vacant' | 'occupied';
export const BED_PAGE_SIZE = 50;

export interface BedPage {
  beds: HostelBed[];
  page: number;
  totalPages: number;
  total: number;
}

/** One page of beds, filtered on the server (?status=, ?q=) — never the whole hostel at once. */
export async function fetchBedPage(page: number, filter: BedFilter, q: string): Promise<BedPage> {
  const { data } = await apiClient.get<ApiEnvelope<HostelBed[]>>('/hostel/beds', {
    params: { page, limit: BED_PAGE_SIZE, ...(filter !== 'all' && { status: filter }), ...(q && { q }) },
  });
  const meta = data.meta;
  return { beds: data.data ?? [], page, totalPages: meta?.totalPages ?? 1, total: meta?.total ?? (data.data ?? []).length };
}

export async function vacateBed(bedId: string) {
  await apiClient.patch(`/hostel/beds/${bedId}/vacate`);
}

export interface HostelStudent {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  admissionNumber: string;
}

/** Only returns students who don't already have a bed — the backend filters this,
 * not the client (see Staff_backend's hostelController.searchStudents). */
export async function searchStudents(q: string): Promise<HostelStudent[]> {
  const { data } = await apiClient.get<ApiEnvelope<HostelStudent[]>>('/hostel/students', { params: { q } });
  return data.data;
}

export async function allocateBed(bedId: string, studentId: string) {
  await apiClient.post('/hostel/beds/allocate', { bedId, studentId });
}
