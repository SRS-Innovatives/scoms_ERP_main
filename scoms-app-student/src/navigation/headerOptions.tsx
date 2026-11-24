import React from 'react';
import { ChildHeaderChip } from '../modules/parent/components/ChildHeaderChip';
import { colors } from '../constants/theme';

const renderChildChip = () => <ChildHeaderChip />;

/** Shared header look for every stack/tab screen. In Parent View the header also shows
 * whose data is on screen (ChildHeaderChip renders nothing for students). */
export function headerOptions(accent: string) {
  return {
    headerTintColor: accent,
    headerTitleStyle: { fontWeight: '700' as const, color: colors.textPrimary, fontSize: 18 },
    headerStyle: { backgroundColor: colors.surface },
    headerShadowVisible: false,
    headerRight: renderChildChip,
  };
}

/** Brand accent for the current mode — violet in Parent View, indigo for students. */
export const accentFor = (isParent: boolean) => (isParent ? colors.parent : colors.primary);
