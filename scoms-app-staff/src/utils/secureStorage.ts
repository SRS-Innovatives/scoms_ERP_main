import * as Keychain from 'react-native-keychain';

const SERVICE = 'scoms.staff.auth';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await Keychain.setGenericPassword(
    tokens.accessToken,
    tokens.refreshToken,
    { service: SERVICE },
  );
}

export async function getTokens(): Promise<StoredTokens | null> {
  const result = await Keychain.getGenericPassword({ service: SERVICE });
  if (!result) return null;
  return { accessToken: result.username, refreshToken: result.password };
}

export async function clearTokens(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
