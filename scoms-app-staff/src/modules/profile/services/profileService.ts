import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export async function fetchMyProfile() {
  const { data } = await apiClient.get<ApiEnvelope<any>>('/profile/me');
  return data.data;
}
