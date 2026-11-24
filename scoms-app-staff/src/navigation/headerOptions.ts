import { colors } from '../constants/theme';

/** Shared header look for every stack / tab screen: white bar, bold dark title, teal back arrow. */
export const headerOptions = {
  headerTintColor: colors.primary,
  headerTitleStyle: { fontWeight: '700' as const, color: colors.textPrimary, fontSize: 18 },
  headerStyle: { backgroundColor: colors.surface },
  headerShadowVisible: false,
};
