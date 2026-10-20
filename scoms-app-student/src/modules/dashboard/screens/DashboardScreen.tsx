import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../store/AuthContext';
import { colors, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { DashboardCard } from '../components/DashboardCard';
import { fetchAttendanceSummary } from '../../attendance/services/attendanceService';
import { fetchAssignments } from '../../homework/services/homeworkService';
import { fetchFeesOverview } from '../../fees/services/feesService';
import { fetchNotifications } from '../../notifications/services/notificationsService';

function isModuleEnabled(user: ReturnType<typeof useAuth>['user'], key: string): boolean {
  const modules = user?.institution?.enabledModules;
  if (!modules) return true; // legacy institutions with no explicit list default to visible
  return modules.some((m: any) => (typeof m === 'string' ? m === key : m.key === key && m.enabled));
}

export function DashboardScreen() {
  const { user, refreshUser } = useAuth();

  const attendanceEnabled = isModuleEnabled(user, 'attendance');
  const homeworkEnabled = isModuleEnabled(user, 'homework');
  const feesEnabled = isModuleEnabled(user, 'fee');

  const attendanceQuery = useQuery({
    queryKey: ['dashboard', 'attendance'],
    queryFn: fetchAttendanceSummary,
    enabled: attendanceEnabled,
  });
  const assignmentsQuery = useQuery({
    queryKey: ['dashboard', 'assignments'],
    queryFn: fetchAssignments,
    enabled: homeworkEnabled,
  });
  const feesQuery = useQuery({
    queryKey: ['dashboard', 'fees'],
    queryFn: fetchFeesOverview,
    enabled: feesEnabled,
  });
  const notificationsQuery = useQuery({
    queryKey: ['dashboard', 'notifications'],
    queryFn: () => fetchNotifications(5),
  });

  const refreshing =
    attendanceQuery.isFetching || assignmentsQuery.isFetching || feesQuery.isFetching || notificationsQuery.isFetching;

  const onRefresh = () => {
    refreshUser();
    attendanceQuery.refetch();
    assignmentsQuery.refetch();
    feesQuery.refetch();
    notificationsQuery.refetch();
  };

  if (!user) return <LoadingView />;

  const pendingHomework = (assignmentsQuery.data ?? []).filter((a) => !a.mySubmission).length;
  const pendingFees = (feesQuery.data ?? []).reduce((sum, a) => sum + a.dueAmount, 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.name}>
          {user.student ? `${user.student.firstName} ${user.student.lastName}` : user.email}
        </Text>
        <Text style={styles.meta}>{user.institution?.name}</Text>
        <Text style={styles.meta}>
          {user.student?.course?.name} {user.student?.section ? `· ${user.student.section.name}` : ''}
        </Text>
      </View>

      <View style={styles.grid}>
        {attendanceEnabled && (
          <DashboardCard
            label="Attendance"
            value={attendanceQuery.data ? `${Math.round(attendanceQuery.data.percentage)}%` : '—'}
            hint="This term"
          />
        )}
        {homeworkEnabled && (
          <DashboardCard
            label="Pending Homework"
            value={assignmentsQuery.data ? String(pendingHomework) : '—'}
            accent={pendingHomework > 0 ? colors.warning : colors.success}
          />
        )}
        {feesEnabled && (
          <DashboardCard
            label="Pending Fees"
            value={feesQuery.data ? `₹${pendingFees}` : '—'}
            accent={pendingFees > 0 ? colors.danger : colors.success}
          />
        )}
        <DashboardCard
          label="Notifications"
          value={notificationsQuery.data ? String(notificationsQuery.data.length) : '—'}
          hint="Recent"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, backgroundColor: colors.primary },
  name: { ...typography.h1, color: '#fff' },
  meta: { ...typography.body, color: '#E0E7FF', marginTop: spacing.xs },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
});
