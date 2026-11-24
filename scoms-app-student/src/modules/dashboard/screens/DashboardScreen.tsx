import React from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../store/AuthContext';
import { useAppModules } from '../../../store/AppModulesContext';
import { useParent } from '../../../store/ParentContext';
import { MODULE_KEYS, ModuleKey } from '../../../navigation/moduleKeys';
import { MODULE_REGISTRY } from '../../../navigation/moduleRegistry';
import { useOpenModule } from '../../../navigation/useOpenModule';
import { MainTabParamList } from '../../../navigation/types';
import { colors, moduleColors, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { Avatar } from '../../../components/Avatar';
import { StatTile } from '../components/StatTile';
import { childClassLabel, childName, fetchParentProfile, parentDisplayName } from '../../parent/services/parentService';
import { fetchDashboardSummary, SummarySection } from '../services/dashboardService';
import { queryKeys } from '../../../services/api/queryKeys';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatMoney = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const timeAgo = (iso: string) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? 'yesterday' : `${days}d ago`;
};

const attendanceColor = (pct: number) => (pct >= 75 ? colors.success : pct >= 60 ? colors.warning : colors.danger);

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const openModule = useOpenModule();
  const { user, refreshUser } = useAuth();
  const { isVisible, refresh: refreshModules } = useAppModules();
  const { isParent, activeChild, children, openSwitcher } = useParent();

  // Widgets follow App Module Access — a hidden module's widget isn't rendered or fetched
  const attendanceEnabled = isVisible(MODULE_KEYS.attendance);
  const homeworkEnabled = isVisible(MODULE_KEYS.homework);
  const feesEnabled = isVisible(MODULE_KEYS.fees);
  const disciplineEnabled = isParent && isVisible(MODULE_KEYS.discipline);
  const healthEnabled = isParent && isVisible(MODULE_KEYS.health);

  // ONE request for the whole home screen (counts/sums server-side) — it used to be five
  // to eight separate list fetches. Only the sections this user can see are asked for.
  const sections: SummarySection[] = [
    ...(attendanceEnabled ? (['attendance'] as const) : []),
    ...(homeworkEnabled ? (['homework'] as const) : []),
    ...(feesEnabled ? (['fees'] as const) : []),
    'notifications',
    ...(disciplineEnabled || healthEnabled ? (['parent'] as const) : []),
  ];
  const sectionsKey = sections.join(',');
  const summaryQuery = useQuery({
    queryKey: queryKeys.dashboardSummary(sectionsKey),
    queryFn: () => fetchDashboardSummary(sections),
    staleTime: 30_000,
  });
  const summary = summaryQuery.data;
  const parentQuery = useQuery({ queryKey: queryKeys.parentProfile, queryFn: fetchParentProfile, enabled: isParent });
  const parentFirstName = parentDisplayName(parentQuery.data)?.split(' ')[0] ?? null;

  const openIncidents = disciplineEnabled ? summary?.parent?.openDiscipline ?? 0 : 0;
  const recentVisits = healthEnabled ? summary?.parent?.recentHealthVisits ?? 0 : 0;
  const referrals = healthEnabled ? summary?.parent?.recentHospitalReferrals ?? 0 : 0;
  const attention = [
    ...(openIncidents > 0
      ? [{ key: 'discipline' as const, icon: 'gavel', text: `${openIncidents} open discipline ${openIncidents === 1 ? 'incident' : 'incidents'}` }]
      : []),
    ...(recentVisits > 0
      ? [{
          key: 'health' as const,
          icon: referrals > 0 ? 'local-hospital' : 'favorite',
          text: referrals > 0 ? 'Referred to hospital this week' : `${recentVisits} sick-room ${recentVisits === 1 ? 'visit' : 'visits'} this week`,
        }]
      : []),
  ];

  const refreshing = summaryQuery.isRefetching;
  const onRefresh = () => {
    refreshUser().catch(() => {});
    refreshModules();
    summaryQuery.refetch();
  };

  if (!user) return <LoadingView />;

  const accent = isParent ? colors.parent : colors.primary;
  const studentName = user.student ? `${user.student.firstName} ${user.student.lastName}`.trim() : user.email ?? 'Student';
  const firstName = user.student?.firstName ?? studentName.split(' ')[0];

  const pendingHomework = summary?.homework?.pending ?? 0;
  const pendingFees = summary?.fees?.totalDue ?? 0;
  const attendancePct = summary?.attendance ? Math.round(summary.attendance.percentage) : null;
  const unread = summary?.notifications?.unread ?? 0;
  const recentNotifications = summary?.notifications?.recent ?? [];

  const quickAccess = MODULE_REGISTRY.filter((m) => isVisible(m.key));
  const openNotifications = () => navigation.navigate('More', { screen: 'Notifications' });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" colors={[accent]} />}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: accent, paddingTop: insets.top + spacing.md }]}>
          <View style={[styles.blob, styles.blobA]} />
          <View style={[styles.blob, styles.blobB, { backgroundColor: isParent ? 'rgba(236,72,153,0.28)' : 'rgba(6,182,212,0.30)' }]} />

          <View style={styles.heroTop}>
            <View style={styles.flex}>
              {isParent ? (
                <View style={styles.modePill}>
                  <Icon name="family-restroom" size={13} color="#fff" />
                  <Text style={styles.modePillText}>PARENT VIEW</Text>
                </View>
              ) : null}
              <Text style={styles.greeting}>{greeting()}</Text>
              <Text style={styles.heroName} numberOfLines={1}>
                {isParent ? (parentFirstName ? `${parentFirstName} 👋` : 'Welcome back') : `${firstName} 👋`}
              </Text>
              <Text style={styles.heroMeta} numberOfLines={1}>
                {user.institution?.name}
              </Text>
            </View>
            <TouchableOpacity onPress={openNotifications} style={styles.bell} accessibilityLabel={`Notifications, ${unread} unread`}>
              <Icon name="notifications-none" size={24} color="#fff" />
              {unread > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        {/* Identity card overlapping the hero: the active child (parent) or the student */}
        <View style={styles.identityCard}>
          {isParent && activeChild ? (
            <>
              <Avatar name={childName(activeChild)} size={56} />
              <View style={styles.identityText}>
                <Text style={styles.overline}>VIEWING</Text>
                <Text style={styles.identityName} numberOfLines={1}>
                  {childName(activeChild)}
                </Text>
                <Text style={styles.identityMeta} numberOfLines={1}>
                  {childClassLabel(activeChild) || 'Class not assigned'}
                  {activeChild.rollNumber ? ` · Roll ${activeChild.rollNumber}` : ''}
                </Text>
              </View>
              {children.length > 1 ? (
                <TouchableOpacity onPress={openSwitcher} style={[styles.switchBtn, { backgroundColor: colors.parentLight }]} accessibilityRole="button">
                  <Icon name="swap-horiz" size={18} color={colors.parent} />
                  <Text style={[styles.switchText, { color: colors.parent }]}>Switch</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <>
              <Avatar name={studentName} size={56} />
              <View style={styles.identityText}>
                <Text style={styles.identityName} numberOfLines={1}>
                  {studentName}
                </Text>
                <Text style={styles.identityMeta} numberOfLines={1}>
                  {[user.student?.course?.name, user.student?.section?.name].filter(Boolean).join(' · ') || 'Student'}
                  {user.student?.rollNumber ? ` · Roll ${user.student.rollNumber}` : ''}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Needs attention (parents) */}
        {attention.length > 0 && (
          <View style={styles.attention}>
            <View style={styles.attentionHeader}>
              <Icon name="priority-high" size={18} color={colors.danger} />
              <Text style={styles.attentionTitle}>Needs your attention</Text>
            </View>
            {attention.map((a) => (
              <TouchableOpacity key={a.key} style={styles.attentionRow} onPress={() => openModule(a.key)} accessibilityRole="button">
                <View style={[styles.attentionIcon, { backgroundColor: moduleColors[a.key].soft }]}>
                  <Icon name={a.icon} size={18} color={moduleColors[a.key].solid} />
                </View>
                <Text style={styles.attentionText}>{a.text}</Text>
                <Icon name="chevron-right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Stats */}
        {(attendanceEnabled || homeworkEnabled || feesEnabled) && (
          <>
            <Text style={styles.sectionTitle}>{isParent ? `${activeChild?.firstName ?? 'Child'}'s overview` : 'At a glance'}</Text>
            <View style={styles.statsRow}>
              {attendanceEnabled && (
                <StatTile
                  label="Attendance"
                  value={attendancePct !== null ? `${attendancePct}%` : '—'}
                  icon="assignment-turned-in"
                  color={attendancePct !== null ? attendanceColor(attendancePct) : moduleColors.attendance.solid}
                  soft={moduleColors.attendance.soft}
                  progress={attendancePct !== null ? attendancePct / 100 : undefined}
                  onPress={() => openModule('attendance')}
                />
              )}
              {homeworkEnabled && (
                <StatTile
                  label="Pending homework"
                  value={summary?.homework ? String(pendingHomework) : '—'}
                  hint={summary?.homework ? (pendingHomework === 0 ? 'All caught up 🎉' : 'to be submitted') : undefined}
                  icon="menu-book"
                  color={moduleColors.homework.solid}
                  soft={moduleColors.homework.soft}
                  onPress={() => openModule('homework')}
                />
              )}
              {feesEnabled && (
                <StatTile
                  label="Fee due"
                  value={summary?.fees ? formatMoney(pendingFees) : '—'}
                  hint={summary?.fees ? (pendingFees > 0 ? 'Tap to pay' : 'No dues ✓') : undefined}
                  icon="account-balance-wallet"
                  color={summary?.fees && pendingFees === 0 ? colors.success : moduleColors.fees.solid}
                  soft={moduleColors.fees.soft}
                  onPress={() => openModule('fees')}
                />
              )}
            </View>
          </>
        )}

        {/* Quick access */}
        <Text style={styles.sectionTitle}>Quick access</Text>
        <View style={styles.grid}>
          {quickAccess.map((m) => (
            <QuickTile key={m.key} moduleKey={m.key} label={m.label} icon={m.icon} onPress={() => openModule(m.key)} />
          ))}
          <QuickTile moduleKey="notifications" label="Alerts" icon="notifications" onPress={openNotifications} />
        </View>

        {/* Recent updates */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, styles.sectionTitleInline]}>Recent updates</Text>
          <Text style={[styles.seeAll, { color: accent }]} onPress={openNotifications}>
            See all
          </Text>
        </View>
        <View style={styles.updates}>
          {recentNotifications.length === 0 ? (
            <View style={styles.emptyUpdates}>
              <Icon name="mark-email-read" size={28} color={colors.disabled} />
              <Text style={styles.emptyText}>{summaryQuery.isLoading ? 'Loading…' : "You're all caught up"}</Text>
            </View>
          ) : (
            recentNotifications.map((n, i) => (
              <TouchableOpacity key={n.id} onPress={openNotifications} style={[styles.updateRow, i > 0 && styles.updateDivider]}>
                <View style={[styles.updateDot, { backgroundColor: n.isRead ? colors.border : accent }]} />
                <View style={styles.flex}>
                  <Text style={[styles.updateTitle, !n.isRead && styles.unreadTitle]} numberOfLines={1}>
                    {n.title}
                  </Text>
                  <Text style={styles.updateMessage} numberOfLines={2}>
                    {n.message}
                  </Text>
                </View>
                <Text style={styles.updateTime}>{timeAgo(n.createdAt)}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function QuickTile({ moduleKey, label, icon, onPress }: { moduleKey: ModuleKey | 'notifications'; label: string; icon: string; onPress: () => void }) {
  const tint = moduleColors[moduleKey] ?? moduleColors.profile;
  return (
    <TouchableOpacity style={styles.quickTile} onPress={onPress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={label}>
      <View style={[styles.quickIcon, { backgroundColor: tint.soft }]}>
        <Icon name={icon} size={26} color={tint.solid} />
      </View>
      <Text style={styles.quickLabel} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 64,
    borderBottomLeftRadius: radius.xl + 8,
    borderBottomRightRadius: radius.xl + 8,
    overflow: 'hidden',
  },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)' },
  blobA: { width: 240, height: 240, top: -90, right: -70 },
  blobB: { width: 150, height: 150, bottom: -60, left: -40 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start' },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  modePillText: { ...typography.overline, color: '#fff', marginLeft: 5 },
  greeting: { ...typography.body, color: colors.textOnDarkMuted },
  heroName: { ...typography.display, color: '#fff', marginTop: 2 },
  heroMeta: { ...typography.caption, color: colors.textOnDarkMuted, marginTop: spacing.xs },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#F43F5E',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: -44,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadow(3),
  },
  identityText: { flex: 1, marginLeft: spacing.md },
  overline: { ...typography.overline, color: colors.parent },
  identityName: { ...typography.h2, color: colors.textPrimary },
  identityMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  switchBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.full, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs + 2 },
  switchText: { fontWeight: '700', fontSize: 13, marginLeft: 4 },
  attention: {
    backgroundColor: colors.dangerLight,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  attentionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  attentionTitle: { ...typography.h3, color: colors.danger, marginLeft: spacing.xs },
  attentionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm + 2, marginTop: spacing.sm },
  attentionIcon: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  attentionText: { ...typography.body, fontWeight: '600', color: colors.textPrimary, flex: 1, marginLeft: spacing.sm + 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm, marginHorizontal: spacing.md },
  sectionTitleInline: { marginRight: 0 },
  seeAll: { fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm },
  statsRow: { flexDirection: 'row', paddingHorizontal: spacing.md - spacing.xs },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: radius.xl,
    paddingVertical: spacing.sm,
    ...shadow(1),
  },
  quickTile: { width: '25%', alignItems: 'center', paddingVertical: spacing.sm + 2, paddingHorizontal: 2 },
  quickIcon: { width: 54, height: 54, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickLabel: { ...typography.caption, fontSize: 12, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
  updates: { backgroundColor: colors.surface, marginHorizontal: spacing.md, borderRadius: radius.xl, paddingHorizontal: spacing.md, ...shadow(1) },
  updateRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.md },
  updateDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  updateDot: { width: 9, height: 9, borderRadius: 5, marginTop: 6, marginRight: spacing.sm + 2 },
  updateTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  unreadTitle: { fontWeight: '800' },
  updateMessage: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  updateTime: { ...typography.caption, fontSize: 11, color: colors.textSecondary, marginLeft: spacing.sm },
  emptyUpdates: { alignItems: 'center', paddingVertical: spacing.lg },
  emptyText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
