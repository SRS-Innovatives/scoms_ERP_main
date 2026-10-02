import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../../store/AuthContext';
import { colors, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { Button } from '../../../components/Button';
import { DashboardCard } from '../components/DashboardCard';
import { fetchMyClasses } from '../../attendance/services/attendanceService';
import { fetchAssignments } from '../../homework/services/homeworkService';
import { fetchMyLeaves } from '../../leave/services/leaveService';
import { fetchNotifications } from '../../notifications/services/notificationsService';
import { MainTabParamList } from '../../../navigation/types';

function isModuleEnabled(user: ReturnType<typeof useAuth>['user'], key: string): boolean {
  const modules = user?.institution?.enabledModules;
  if (!modules) return true;
  return modules.some((m: any) => (typeof m === 'string' ? m === key : m.key === key && m.enabled));
}

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export function DashboardScreen({ navigation }: Props) {
  const { user, refreshUser } = useAuth();

  const attendanceEnabled = isModuleEnabled(user, 'attendance');
  const homeworkEnabled = isModuleEnabled(user, 'homework');

  const classesQuery = useQuery({
    queryKey: ['dashboard', 'myClasses'],
    queryFn: fetchMyClasses,
    enabled: attendanceEnabled,
  });
  const assignmentsQuery = useQuery({
    queryKey: ['dashboard', 'assignments'],
    queryFn: fetchAssignments,
    enabled: homeworkEnabled,
  });
  const leavesQuery = useQuery({
    queryKey: ['dashboard', 'leaves'],
    queryFn: fetchMyLeaves,
  });
  const notificationsQuery = useQuery({
    queryKey: ['dashboard', 'notifications'],
    queryFn: () => fetchNotifications(5),
  });

  const refreshing =
    classesQuery.isFetching || assignmentsQuery.isFetching || leavesQuery.isFetching || notificationsQuery.isFetching;

  const onRefresh = () => {
    refreshUser();
    classesQuery.refetch();
    assignmentsQuery.refetch();
    leavesQuery.refetch();
    notificationsQuery.refetch();
  };

  if (!user) return <LoadingView />;

  const pendingLeaves = (leavesQuery.data ?? []).filter((l) => l.status === 'PENDING').length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{user.staff ? `${user.staff.designation}` : user.email}</Text>
        <Text style={styles.meta}>{user.institution?.name}</Text>
        <Text style={styles.meta}>{user.staff?.department?.name}</Text>
      </View>

      <View style={styles.grid}>
        {attendanceEnabled && (
          <DashboardCard
            label="Today's Classes"
            value={classesQuery.data ? String(classesQuery.data.length) : '—'}
          />
        )}
        {homeworkEnabled && (
          <DashboardCard
            label="Homework Set"
            value={assignmentsQuery.data ? String(assignmentsQuery.data.length) : '—'}
          />
        )}
        <DashboardCard
          label="Leave Status"
          value={leavesQuery.data ? String(pendingLeaves) : '—'}
          hint="Pending"
          accent={pendingLeaves > 0 ? colors.warning : colors.success}
        />
        <DashboardCard
          label="Notifications"
          value={notificationsQuery.data ? String(notificationsQuery.data.length) : '—'}
          hint="Recent"
        />
      </View>

      <View style={styles.actions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {attendanceEnabled && (
          <Button label="Take Attendance" onPress={() => navigation.navigate('Attendance')} style={styles.actionButton} />
        )}
        {homeworkEnabled && (
          <Button
            label="Add Homework"
            variant="secondary"
            onPress={() => navigation.navigate('Homework')}
            style={styles.actionButton}
          />
        )}
        <Button
          label="Apply Leave"
          variant="secondary"
          onPress={() => navigation.navigate('More', { screen: 'Leave' } as never)}
          style={styles.actionButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, backgroundColor: colors.primary },
  name: { ...typography.h1, color: '#fff' },
  meta: { ...typography.body, color: '#CCFBF1', marginTop: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: spacing.md },
  actions: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  actionButton: { marginBottom: spacing.sm },
});
