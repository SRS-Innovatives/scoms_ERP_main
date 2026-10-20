import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  type: string;
  location: string | null;
  status: string;
  applicationDeadline: string | null;
  _count: { applications: number };
}

export async function fetchPostings(): Promise<JobPosting[]> {
  const { data } = await apiClient.get<ApiEnvelope<JobPosting[]>>('/postings');
  return data.data;
}

export interface CreatePostingPayload {
  title: string;
  company: string;
  type?: 'INTERNSHIP' | 'FULL_TIME' | 'PART_TIME';
  location?: string;
  compensation?: string;
  description?: string;
  eligibility?: string;
  applicationDeadline?: string;
}

export async function createPosting(payload: CreatePostingPayload) {
  const { data } = await apiClient.post<ApiEnvelope<JobPosting>>('/postings', payload);
  return data.data;
}

export async function closePosting(id: string) {
  await apiClient.patch(`/postings/${id}/close`);
}
