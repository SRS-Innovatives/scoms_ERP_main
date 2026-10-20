import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface AssignmentSubmission {
  id: string;
  content: string | null;
  fileUrl: string | null;
  status: 'SUBMITTED' | 'REVIEWED' | 'LATE';
  marksObtained: number | null;
  feedback: string | null;
  submittedAt: string;
}

// subjectName/className are plain strings on the Assignment model itself, not
// relations. mySubmission is null until this student has submitted — that's the
// real signal for "Pending" vs "Submitted", not a `status` field (Assignment.status
// is PUBLISHED/CLOSED, about the assignment itself, not this student's submission).
export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectName: string;
  dueDate: string;
  totalMarks: number;
  attachmentUrl: string | null;
  mySubmission: AssignmentSubmission | null;
}

export async function fetchAssignments(): Promise<Assignment[]> {
  const { data } = await apiClient.get<ApiEnvelope<Assignment[]>>('/assignments');
  return data.data;
}

export async function submitAssignment(assignmentId: string, content: string) {
  const { data } = await apiClient.post<ApiEnvelope<AssignmentSubmission>>('/assignments/submit', {
    assignmentId,
    content,
  });
  return data.data;
}
