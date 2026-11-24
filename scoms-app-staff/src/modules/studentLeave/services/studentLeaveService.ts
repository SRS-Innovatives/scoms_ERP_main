import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

/** A student's leave request, as Staff_backend studentLeaveController returns it. */
export interface StudentLeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy: string | null;
  createdAt: string;
  hasAttachment: boolean;
  /** true only where this staff member decides (class teacher / HOD's department / Principal) */
  canDecide: boolean;
  student: { firstName: string; lastName: string; rollNumber: string; sectionId: string; section: { name: string } | null } | null;
}

export async function fetchStudentLeaves(): Promise<StudentLeaveRequest[]> {
  const { data } = await apiClient.get<ApiEnvelope<StudentLeaveRequest[]>>('/student-leave');
  return data.data ?? [];
}

export async function decideStudentLeave(id: string, status: 'APPROVED' | 'REJECTED') {
  const { data } = await apiClient.patch<ApiEnvelope<StudentLeaveRequest>>(`/student-leave/${id}`, { status });
  return data.data;
}
