import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../store/AuthContext';
import { colors, moduleColor, radius, ROLE_LABELS, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { Avatar } from '../../../components/Avatar';
import { Card } from '../../../components/Card';
import { StatTile } from '../../../components/StatTile';
import { IconTile } from '../../../components/IconTile';
import { SectionHeader } from '../../../components/SectionHeader';
import { DeskTiles } from '../components/DeskTiles';
import { MainTabParamList, ModuleScreenName } from '../../../navigation/types';
import { queryKeys } from '../../../services/api/queryKeys';
import { fetchDashboardSummary, StaffDashboardSummary } from '../services/dashboardService';
import { useAppModules } from '../../../services/api/appModules';
import { useModuleLayout } from '../../../navigation/moduleRegistry';
import { useOpenModule } from '../../../navigation/useOpenModule';
import { ModuleKey } from '../../../navigation/moduleKeys';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

const DESK_SCREEN: Record<string, ModuleScreenName> = {
  library: 'Library',
  transport: 'Transport',
  hostel: 'Hostel',
  exam_setup: 'ExamSetup',
  placement: 'Placement',
};
type ClassItem = NonNullable<StaffDashboardSummary['today']>['classes'][number];

/** "09:00" → minutes since midnight, for "now / next" highlighting. */
const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const greetingFor = (hour: number) => (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');

/** Shorter labels for the quick-access grid (the registry label is the screen title). */
const QUICK_LABEL: Partial<Record<ModuleScreenName, string>> = {
  Examination: 'Marks',
  Leave: 'My Leave',
  StudentLeave: 'Approvals',
};

export function DashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { refetch: refetchAppModules } = useAppModules();
  // Everything below follows the same layout as the tabs (role + institution + Super Admin)
  const { tabs, more } = useModuleLayout();
  const openModule = useOpenModule();
  const modules = [...tabs, ...more];
  const has = (key: ModuleKey) => modules.some((m) => m.key === key);
  const hasScreen = (screen: ModuleScreenName) => modules.some((m) => m.screen === screen);
  /** Opens one specific screen (a module key can back two screens, e.g. attendance). */
  const openScreen = (screen: ModuleScreenName) => {
    if (tabs.some((m) => m.screen === screen)) return navigation.navigate(screen);
    return navigation.navigate('More', { screen });
  };

  // ONE request for the whole home screen (Staff_backend dashboardSummaryController)
  const summaryQuery = useQuery({ queryKey: queryKeys.dashboardSummary, queryFn: fetchDashboardSummary, staleTime: 30_000 });
  const s = summaryQuery.data;

  // The teal hero needs light status-bar icons; every other screen has a white header.
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, []),
  );

  const onRefresh = () => {
    refreshUser();
    refetchAppModules();
    summaryQuery.refetch();
  };

  if (!user) return <LoadingView />;

  const openMore = (screen: 'Notifications' | 'Profile') => navigation.navigate('More', { screen });

  const fullName = [user.staff?.firstName, user.staff?.lastName].filter(Boolean).join(' ').trim();
  const displayName = fullName || user.staff?.designation || user.email || 'Welcome';
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const dateLabel = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const classes = s?.today?.classes ?? [];
  const current = classes.find((c) => minutesOf(c.startTime) <= nowMin && nowMin < minutesOf(c.endTime));
  const next = classes.find((c) => minutesOf(c.startTime) > nowMin);
  const unread = s?.notifications?.unread ?? 0;
  const v = (n: number | null | undefined) => (n === undefined || n === null ? '—' : String(n));
  const approvals = s?.approvals ?? null;
  const showLeaveApprovals = hasScreen('StudentLeave') && typeof approvals?.studentLeave === 'number';
  const showCorrections = hasScreen('AttendanceCorrections') && typeof approvals?.corrections === 'number';
  const badgeFor = (screen: ModuleScreenName): number | undefined => {
    if (screen === 'Homework') return s?.homework?.toReview;
    if (screen === 'StudentLeave') return approvals?.studentLeave ?? undefined;
    if (screen === 'AttendanceCorrections') return approvals?.corrections ?? undefined;
    return undefined;
  };

  const showToday = has('timetable') && s?.today !== null;
  const showHomework = has('homework') && s?.homework !== null;
  const showLeave = has('leave') && s?.leave !== null;
  const todayHint = !s?.today
    ? undefined
    : current
      ? 'One in progress'
      : next
        ? `Next at ${next.startTime}`
        : s.today.count
          ? 'All done for today'
          : 'Free day';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={summaryQuery.isRefetching}
          onRefresh={onRefresh}
          tintColor="#fff"
          colors={[colors.primary]}
          progressViewOffset={insets.top}
        />
      }
    >
      {/* Hero */}
      <View style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
        <View style={[styles.blob, styles.blobA]} />
        <View style={[styles.blob, styles.blobB]} />
        <View style={styles.heroTop}>
          <TouchableOpacity onPress={() => openMore('Profile')} accessibilityRole="button" accessibilityLabel="Open profile">
            <Avatar name={displayName} size={52} ring color={colors.primaryDeep} />
          </TouchableOpacity>
          <View style={styles.heroText}>
            <Text style={styles.greeting}>{greetingFor(now.getHours())},</Text>
            <Text style={styles.heroName} numberOfLines={1}>
              {displayName}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bell}
            onPress={() => openMore('Notifications')}
            accessibilityRole="button"
            accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          >
            <Icon name="notifications-none" size={24} color="#fff" />
            {unread > 0 ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.rolePill}>
            <Icon name="verified" size={13} color="#fff" />
            <Text style={styles.rolePillText}>{roleLabel.toUpperCase()}</Text>
          </View>
          {user.staff?.designation && user.staff.designation !== roleLabel ? (
            <Text style={styles.heroMeta} numberOfLines={1}>
              {user.staff.designation}
            </Text>
          ) : null}
        </View>
        <Text style={styles.heroMeta} numberOfLines={1}>
          {[user.institution?.name, user.staff?.department?.name].filter(Boolean).join(' · ')}
        </Text>
        <Text style={styles.date}>{dateLabel}</Text>
      </View>

      <View style={styles.body}>
        {summaryQuery.isError ? (
          <TouchableOpacity onPress={() => summaryQuery.refetch()} style={styles.errorBanner} accessibilityRole="button">
            <Icon name="cloud-off" size={18} color={colors.danger} />
            <Text style={styles.errorText}>Couldn't load today's numbers. Tap to retry.</Text>
          </TouchableOpacity>
        ) : null}

        {/* Numbers */}
        <View style={styles.grid}>
          {s?.desk && hasScreen(DESK_SCREEN[s.desk.kind]) ? <DeskTiles desk={s.desk} open={openScreen} /> : null}
          {showToday && (
            <StatTile
              label="Classes today"
              value={v(s?.today?.count)}
              hint={todayHint}
              icon="calendar-today"
              accent={moduleColor('timetable')}
              onPress={() => openModule('timetable')}
            />
          )}
          {showHomework && (
            <StatTile
              label="To review"
              value={v(s?.homework?.toReview)}
              hint={s?.homework ? `${s.homework.active} active · ${s.homework.total} set` : undefined}
              icon="rate-review"
              accent={moduleColor('homework')}
              alert={!!s?.homework && s.homework.toReview > 0}
              onPress={() => openModule('homework')}
            />
          )}
          {showLeaveApprovals && (
            <StatTile
              label="Leave to approve"
              value={v(approvals?.studentLeave)}
              hint="Student requests"
              icon="fact-check"
              accent={moduleColor('student_leave')}
              alert={(approvals?.studentLeave ?? 0) > 0}
              onPress={() => openScreen('StudentLeave')}
            />
          )}
          {showCorrections && (
            <StatTile
              label="Corrections"
              value={v(approvals?.corrections)}
              hint="Attendance to review"
              icon="rule"
              accent={moduleColor('attendance_corrections')}
              alert={(approvals?.corrections ?? 0) > 0}
              onPress={() => openScreen('AttendanceCorrections')}
            />
          )}
          {showLeave && (
            <StatTile
              label="Leave pending"
              value={v(s?.leave?.pending)}
              hint={s?.leave ? `${s.leave.approved} approved` : undefined}
              icon="event-available"
              accent={moduleColor('leave')}
              onPress={() => openModule('leave')}
            />
          )}
          <StatTile
            label="Unread"
            value={v(s?.notifications?.unread)}
            hint="Notifications"
            icon="notifications"
            accent={moduleColor('notifications')}
            alert={unread > 0}
            onPress={() => openMore('Notifications')}
          />
        </View>

        {/* Up next */}
        {showToday && (current || next) ? <UpNextCard item={(current ?? next) as ClassItem} live={!!current} /> : null}

        {/* Today's schedule */}
        {showToday && s?.today ? (
          <View style={styles.section}>
            <SectionHeader title="Today's schedule" action={{ label: 'Full week', onPress: () => openModule('timetable') }} />
            {classes.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Icon name="free-breakfast" size={26} color={moduleColor('timetable').solid} />
                <Text style={styles.emptyText}>No classes on your timetable today.</Text>
              </Card>
            ) : (
              <Card style={styles.timeline}>
                {classes.map((c, i) => (
                  <TimelineRow key={c.id} item={c} nowMin={nowMin} isNext={c.id === next?.id} last={i === classes.length - 1} />
                ))}
              </Card>
            )}
          </View>
        ) : null}

        {/* Quick access */}
        <View style={styles.section}>
          <SectionHeader title="Quick access" />
          <Card style={styles.quickGrid}>
            {modules.map((m) => (
              <IconTile
                key={m.screen}
                label={QUICK_LABEL[m.screen] ?? m.label}
                icon={m.icon}
                accent={moduleColor(m.accent)}
                badge={badgeFor(m.screen)}
                onPress={() => openScreen(m.screen)}
              />
            ))}
            <IconTile label="Alerts" icon="notifications" accent={moduleColor('notifications')} badge={unread} onPress={() => openMore('Notifications')} />
            <IconTile label="Profile" icon="person" accent={moduleColor('profile')} onPress={() => openMore('Profile')} />
          </Card>
          {modules.length <= 1 ? <Text style={styles.footNote}>More tools for your role are on the SCOMS web portal.</Text> : null}
        </View>
      </View>
    </ScrollView>
  );
}

function UpNextCard({ item, live }: { item: ClassItem; live: boolean }) {
  const accent = moduleColor('timetable');
  return (
    <View style={[styles.upNext, live ? styles.upNextLive : styles.upNextIdle]}>
      <View style={[styles.upNextIcon, live ? styles.upNextIconLive : styles.upNextIconIdle]}>
        <Icon name={live ? 'play-circle-filled' : 'schedule'} size={26} color={live ? '#fff' : accent.solid} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.upNextLabel, live && styles.onDarkMuted]}>{live ? 'IN PROGRESS' : 'UP NEXT'}</Text>
        <Text style={[styles.upNextSubject, live && styles.onDark]} numberOfLines={1}>
          {item.subject ?? `Period ${item.period}`}
        </Text>
        <Text style={[styles.upNextMeta, live && styles.onDarkMuted]} numberOfLines={1}>
          {[`${item.startTime} – ${item.endTime}`, item.className, item.roomNumber ? `Room ${item.roomNumber}` : null].filter(Boolean).join(' · ')}
        </Text>
      </View>
    </View>
  );
}

function TimelineRow({ item, nowMin, isNext, last }: { item: ClassItem; nowMin: number; isNext: boolean; last: boolean }) {
  const isNow = minutesOf(item.startTime) <= nowMin && nowMin < minutesOf(item.endTime);
  const done = minutesOf(item.endTime) <= nowMin;
  const dotColor = isNow ? colors.primary : done ? colors.disabled : moduleColor('timetable').solid;
  return (
    <View style={[styles.tlRow, done && styles.tlDone]}>
      <View style={styles.tlTime}>
        <Text style={styles.tlStart}>{item.startTime}</Text>
        <Text style={styles.tlEnd}>{item.endTime}</Text>
      </View>
      <View style={styles.tlRail}>
        <View style={[styles.tlDot, { backgroundColor: dotColor }, isNow && styles.tlDotNow]} />
        {!last ? <View style={styles.tlLine} /> : null}
      </View>
      <View style={styles.tlBody}>
        <Text style={styles.tlSubject} numberOfLines={1}>
          {item.subject ?? `Period ${item.period}`}
        </Text>
        <Text style={styles.tlMeta} numberOfLines={1}>
          {[item.className, item.roomNumber ? `Room ${item.roomNumber}` : null].filter(Boolean).join(' · ') || `Period ${item.period}`}
        </Text>
      </View>
      {isNow ? <Text style={styles.nowBadge}>NOW</Text> : isNext ? <Text style={styles.nextBadge}>NEXT</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.lg },
  flex: { flex: 1 },
  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: 56,
    borderBottomLeftRadius: radius.xl + 8,
    borderBottomRightRadius: radius.xl + 8,
    overflow: 'hidden',
  },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)' },
  blobA: { width: 240, height: 240, top: -90, right: -70 },
  blobB: { width: 150, height: 150, bottom: -60, left: -40, backgroundColor: 'rgba(255,255,255,0.07)' },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  heroText: { flex: 1, marginHorizontal: spacing.md },
  greeting: { ...typography.body, color: colors.textOnDarkMuted },
  heroName: { ...typography.h1, color: '#fff', marginTop: 2 },
  bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    marginRight: spacing.sm,
  },
  rolePillText: { ...typography.overline, color: '#fff', marginLeft: 4 },
  heroMeta: { ...typography.caption, color: colors.textOnDarkMuted, marginTop: spacing.xs, flexShrink: 1 },
  date: { ...typography.caption, fontWeight: '700', color: '#fff', marginTop: spacing.sm },
  body: { paddingHorizontal: spacing.md, marginTop: -40 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    ...shadow(1),
  },
  errorText: { ...typography.caption, color: colors.textPrimary, marginLeft: spacing.sm, flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  upNext: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadow(2) },
  upNextLive: { backgroundColor: colors.primaryDark },
  upNextIdle: { backgroundColor: colors.surface },
  upNextIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  upNextIconLive: { backgroundColor: 'rgba(255,255,255,0.16)' },
  upNextIconIdle: { backgroundColor: moduleColor('timetable').soft },
  upNextLabel: { ...typography.overline, color: colors.primary },
  upNextSubject: { ...typography.h2, color: colors.textPrimary, marginTop: 2 },
  upNextMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  onDark: { color: '#fff' },
  onDarkMuted: { color: colors.textOnDarkMuted },
  section: { marginBottom: spacing.md },
  emptyCard: { flexDirection: 'row', alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textSecondary, marginLeft: spacing.md, flex: 1 },
  timeline: { paddingVertical: spacing.sm },
  tlRow: { flexDirection: 'row', alignItems: 'stretch', minHeight: 58 },
  tlDone: { opacity: 0.5 },
  tlTime: { width: 52, paddingTop: 2 },
  tlStart: { ...typography.caption, fontWeight: '800', color: colors.textPrimary },
  tlEnd: { ...typography.caption, fontSize: 11, color: colors.textSecondary },
  tlRail: { width: 22, alignItems: 'center' },
  tlDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  tlDotNow: { width: 16, height: 16, borderRadius: 8, marginTop: 2, borderWidth: 3, borderColor: colors.primarySoft },
  tlLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  tlBody: { flex: 1, paddingLeft: spacing.sm, paddingBottom: spacing.sm },
  tlSubject: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  tlMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  nowBadge: {
    ...typography.overline,
    color: '#fff',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  nextBadge: {
    ...typography.overline,
    color: colors.primary,
    borderColor: colors.primary,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingTop: spacing.md, paddingBottom: 0, paddingHorizontal: spacing.xs },
  footNote: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});
