import { Platform, ViewStyle } from 'react-native';

/**
 * SCOMS app palette — a vivid indigo brand with a distinct accent per module, so each
 * feature is recognisable at a glance (same colour on its dashboard tile, quick-access
 * icon and screen accents). Parent mode uses the violet `parent` accent throughout so a
 * parent always knows they're in Parent View.
 */
export const colors = {
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  primaryLight: '#EEF2FF',
  secondary: '#06B6D4',
  parent: '#7C3AED',
  parentDark: '#5B21B6',
  parentLight: '#F5F3FF',
  background: '#F5F7FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: 'rgba(255,255,255,0.78)',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  disabled: '#CBD5E1',
};

/** Accent per app module — { solid, soft } for icon tiles and tinted backgrounds. */
export const moduleColors: Record<string, { solid: string; soft: string }> = {
  attendance: { solid: '#10B981', soft: '#D1FAE5' },
  timetable: { solid: '#0EA5E9', soft: '#E0F2FE' },
  homework: { solid: '#F59E0B', soft: '#FEF3C7' },
  fees: { solid: '#F43F5E', soft: '#FFE4E6' },
  examination: { solid: '#8B5CF6', soft: '#EDE9FE' },
  certificates: { solid: '#14B8A6', soft: '#CCFBF1' },
  leave: { solid: '#0D9488', soft: '#CCFBF1' },
  announcements: { solid: '#2563EB', soft: '#DBEAFE' },
  academic_calendar: { solid: '#65A30D', soft: '#ECFCCB' },
  materials: { solid: '#0891B2', soft: '#CFFAFE' },
  gallery: { solid: '#DB2777', soft: '#FCE7F3' },
  transport: { solid: '#EA580C', soft: '#FFEDD5' },
  discipline: { solid: '#F97316', soft: '#FFEDD5' },
  health: { solid: '#E11D48', soft: '#FFE4E6' },
  ptm: { solid: '#C026D3', soft: '#FAE8FF' },
  notifications: { solid: '#6366F1', soft: '#E0E7FF' },
  profile: { solid: '#64748B', soft: '#F1F5F9' },
};

/** Avatar colours — picked deterministically from a name so a child keeps "their" colour. */
export const avatarPalette = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#0EA5E9', '#8B5CF6', '#F43F5E', '#14B8A6'];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  full: 999,
};

export const typography = {
  display: { fontSize: 28, fontWeight: '800' as const },
  h1: { fontSize: 24, fontWeight: '700' as const },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  overline: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8 },
};

/** Soft elevation that looks the same on both platforms. */
export const shadow = (level: 1 | 2 | 3 = 1): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#1E1B4B',
      shadowOpacity: 0.06 + level * 0.03,
      shadowRadius: 4 + level * 4,
      shadowOffset: { width: 0, height: 2 + level * 2 },
    },
    default: { elevation: level * 2 },
  }) as ViewStyle;
