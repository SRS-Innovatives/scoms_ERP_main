import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface Announcement {
  id: string;
  institutionId: string | null; // null = platform-wide
  title: string;
  content: string;
  targetRole: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT' | string;
  createdAt: string;
}

export interface Circular {
  id: string;
  refNo: string | null;
  title: string;
  description: string | null;
  issuedBy: string | null;
  issueDate: string;
  audience: string;
  attachmentName: string | null;
  hasAttachment: boolean;
  createdAt: string;
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data } = await apiClient.get<ApiEnvelope<Announcement[]>>('/announcements', { params: { limit: 50 } });
  return data.data ?? [];
}

export async function fetchCirculars(): Promise<Circular[]> {
  const { data } = await apiClient.get<ApiEnvelope<Circular[]>>('/circulars');
  return data.data ?? [];
}
