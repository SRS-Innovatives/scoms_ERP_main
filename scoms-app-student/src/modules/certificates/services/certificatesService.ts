import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface IssuedCertificate {
  id: string;
  type: string;
  title: string;
  certificateNo: string;
  pdfUrl: string | null;
  createdAt: string;
}

export interface CertificateRequest {
  id: string;
  type: string;
  reason: string | null;
  status: 'PENDING' | 'APPROVED' | 'READY' | 'REJECTED';
  certificateNo: string | null;
  createdAt: string;
}

export const CERTIFICATE_TYPES = ['BONAFIDE', 'TRANSFER', 'CONDUCT', 'COURSE_COMPLETION'] as const;
export type CertificateType = (typeof CERTIFICATE_TYPES)[number];

export async function fetchMyCertificates(): Promise<IssuedCertificate[]> {
  const { data } = await apiClient.get<ApiEnvelope<IssuedCertificate[]>>('/certificates');
  return data.data;
}

export async function fetchCertificateRequests(): Promise<CertificateRequest[]> {
  const { data } = await apiClient.get<ApiEnvelope<CertificateRequest[]>>('/certificate-requests');
  return data.data;
}

export async function requestCertificate(type: CertificateType, reason?: string) {
  const { data } = await apiClient.post<ApiEnvelope<CertificateRequest>>('/certificate-requests', { type, reason });
  return data.data;
}
