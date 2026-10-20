import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

// subjectName/className are plain strings on the Assignment model itself, not
// relations — Assignment.className is resolved server-side from the staff's real
// section at creation time (see createAssignment), never a client-supplied FK.
export interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  subjectName: string;
  className: string;
  status: string;
  _count: { submissions: number };
}

export interface MyClass {
  subjectId: string;
  subjectName: string;
  sectionId: string;
  className: string;
}

export async function fetchMyClasses(): Promise<MyClass[]> {
  const { data } = await apiClient.get<ApiEnvelope<MyClass[]>>('/assignments/my-classes');
  return data.data;
}

export async function fetchAssignments(): Promise<Assignment[]> {
  const { data } = await apiClient.get<ApiEnvelope<Assignment[]>>('/assignments');
  return data.data;
}

export interface CreateAssignmentPayload {
  sectionId: string;
  subjectId: string;
  title: string;
  description?: string;
  dueDate: string;
  totalMarks?: number;
  attachmentUrl?: string; // base64 data URI — PNG/JPEG/PDF/Word, max 5MB
}

export async function createAssignment(payload: CreateAssignmentPayload) {
  const { data } = await apiClient.post<ApiEnvelope<any>>('/assignments', payload);
  return data.data;
}

export async function fetchSubmissions(assignmentId: string) {
  const { data } = await apiClient.get<ApiEnvelope<any>>(`/assignments/${assignmentId}/submissions`);
  return data.data;
}

export async function evaluateSubmission(submissionId: string, marks: number, feedback?: string) {
  const { data } = await apiClient.patch<ApiEnvelope<any>>(`/assignments/submissions/${submissionId}/evaluate`, {
    marks,
    feedback,
  });
  return data.data;
}
