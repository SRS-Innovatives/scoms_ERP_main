import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';
import { AppModulesResponse } from '../../../types/appModules';

/** Which app modules the logged-in user sees (Super Admin → App Module Access). */
export async function fetchAppModules(): Promise<AppModulesResponse> {
  const { data } = await apiClient.get<ApiEnvelope<AppModulesResponse>>('/app-modules');
  return data.data;
}
