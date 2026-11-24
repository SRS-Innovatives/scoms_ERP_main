import { Platform, ViewStyle } from 'react-native';

/**
 * SCOMS Staff palette — a fresh teal brand (distinct from the student app's indigo, so a
 * teacher with both apps never mixes them up) with one accent per module, used on its
 * dashboard tile, quick-access icon, More-menu icon and screen accents.
 */
export const colors = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryDeep: '#134E4A',
  primaryLight: '#F0FDFA',
  primarySoft: '#CCFBF1',
  secondary: '#6366F1',
  background: '#F4F7F9',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: 'rgba(255,255,255,0.8)',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  info: '#0EA5E9',
  infoLight: '#F0F9FF',
  disabled: '#CBD5E1',
};

/** Accent per Staff App module — { solid, soft } for icon tiles and tinted backgrounds. */
export const moduleColors: Record<string, { solid: string; soft: string }> = {
  attendance: { solid: '#10B981', soft: '#D1FAE5' },
  homework: { solid: '#F59E0B', soft: '#FEF3C7' },
  examination: { solid: '#8B5CF6', soft: '#EDE9FE' },
  timetable: { solid: '#0EA5E9', soft: '#E0F2FE' },
  leave: { solid: '#14B8A6', soft: '#CCFBF1' },
  library: { solid: '#6366F1', soft: '#E0E7FF' },
  transport: { solid: '#F97316', soft: '#FFEDD5' },
  hostel: { solid: '#EC4899', soft: '#FCE7F3' },
  exam_setup: { solid: '#7C3AED', soft: '#EDE9FE' },
  placement: { solid: '#2563EB', soft: '#DBEAFE' },
  student_leave: { solid: '#D97706', soft: '#FEF3C7' },
  attendance_corrections: { solid: '#059669', soft: '#D1FAE5' },
  announcements: { solid: '#2563EB', soft: '#DBEAFE' },
  academic_calendar: { solid: '#65A30D', soft: '#ECFCCB' },
  ptm: { solid: '#C026D3', soft: '#FAE8FF' },
  materials: { solid: '#0891B2', soft: '#CFFAFE' },
  exam_duties: { solid: '#7C3AED', soft: '#EDE9FE' },
  messages: { solid: '#4F46E5', soft: '#E0E7FF' },
  notifications: { solid: '#E11D48', soft: '#FFE4E6' },
  profile: { solid: '#64748B', soft: '#F1F5F9' },
};

export const moduleColor = (key: string) => moduleColors[key] ?? { solid: colors.primary, soft: colors.primarySoft };

/** Avatar colours — picked deterministically from a name so a person keeps "their" colour. */
export const avatarPalette = ['#0D9488', '#6366F1', '#F59E0B', '#EC4899', '#0EA5E9', '#8B5CF6', '#F97316', '#10B981'];

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
      shadowColor: '#042F2E',
      shadowOpacity: 0.06 + level * 0.03,
      shadowRadius: 4 + level * 4,
      shadowOffset: { width: 0, height: 2 + level * 2 },
    },
    default: { elevation: level * 2 },
  }) as ViewStyle;

/** Human label for a staff role (header badge, profile). */
export const ROLE_LABELS: Record<string, string> = {
  TEACHER: 'Teacher',
  HOD: 'Head of Department',
  PRINCIPAL: 'Principal',
  VICE_PRINCIPAL: 'Vice Principal',
  STAFF: 'Staff',
  ACCOUNTANT: 'Accountant',
  LIBRARIAN: 'Librarian',
  TRANSPORT_MANAGER: 'Transport Manager',
  HOSTEL_WARDEN: 'Hostel Warden',
  EXAM_ADMIN: 'Exam Admin',
  PLACEMENT_OFFICER: 'Placement Officer',
};
