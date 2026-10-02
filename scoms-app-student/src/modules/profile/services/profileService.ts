import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export async function fetchProfile() {
  const { data } = await apiClient.get<ApiEnvelope<any>>('/profile');
  return data.data;
}
