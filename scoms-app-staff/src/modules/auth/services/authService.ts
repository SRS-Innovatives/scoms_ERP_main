import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';
import { AuthUser, LoginResponse } from '../../../types/auth';

export async function login(identifier: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiEnvelope<LoginResponse>>('/auth/login', {
    identifier,
    password,
  });
  return data.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<ApiEnvelope<AuthUser>>('/auth/me');
  return data.data;
}

export async function forgotPassword(identifier: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { identifier });
}

export async function verifyOtp(identifier: string, otp: string): Promise<void> {
  await apiClient.post('/auth/verify-otp', { identifier, otp });
}

export async function resetPassword(identifier: string, otp: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/reset-password', { identifier, otp, newPassword });
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/change-password', { oldPassword, newPassword });
}
