import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface MyAttendanceSummary {
  percentage: number;
  totalDays: number;
  presentDays: number;
  [key: string]: unknown;
}

// Staff's own self-attendance (module `attendance` self-service)
export async function fetchMyAttendance(): Promise<MyAttendanceSummary> {
  const { data } = await apiClient.get<ApiEnvelope<MyAttendanceSummary>>('/attendance/self');
  return data.data;
}

// A raw SubjectTeacherMapping row, exactly as attendanceController.getMyClasses
// returns it — subjectId/sectionId are real scalar fields on the mapping itself,
// subject/section are the related records (nested, not flat strings).
export interface ClassAssignment {
  id: string;
  subjectId: string;
  sectionId: string;
  subject: { id: string; name: string; code: string };
  section: {
    id: string;
    name: string;
    semester: { name: string; course: { name: string } };
    _count: { students: number };
  };
}

// Classes/sections/subjects this staff member is authorized to take attendance for —
// the backend, not the client, decides this list (requireModule + shadowPermission).
export async function fetchMyClasses(): Promise<ClassAssignment[]> {
  const { data } = await apiClient.get<ApiEnvelope<ClassAssignment[]>>('/attendance/my-classes');
  return data.data;
}

// getRoster's `status` is the student's own enrollment status (always "ACTIVE" —
// the query filters on it), NOT an attendance mark for today. attendancePercent is
// a real computed stat from past sessions; there is no "today's mark" in this
// response at all — a fresh roster always starts unmarked (see RosterDraftItem in
// AttendanceScreen.tsx, which layers local marking state on top of this).
export interface RosterStudent {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  admissionNumber: string;
  status: string;
  attendancePercent: number | null;
}

export async function fetchRoster(sectionId: string): Promise<RosterStudent[]> {
  const { data } = await apiClient.get<ApiEnvelope<RosterStudent[]>>('/attendance/roster', {
    params: { sectionId },
  });
  return data.data;
}

export interface MarkAttendancePayload {
  sectionId: string;
  subjectId: string;
  date: string;
  records: { studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_DUTY' }[];
}

// The backend independently re-verifies this staff member is actually assigned to
// this section/subject/period before accepting the submission — the client only
// gets to pick from the roster it was already handed.
export async function markAttendance(payload: MarkAttendancePayload) {
  const { data } = await apiClient.post<ApiEnvelope<any>>('/attendance/mark', payload);
  return data.data;
}
