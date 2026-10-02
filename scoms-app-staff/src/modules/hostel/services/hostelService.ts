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

export async function fetchBeds(): Promise<HostelBed[]> {
  const { data } = await apiClient.get<ApiEnvelope<HostelBed[]>>('/hostel/beds');
  return data.data;
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
