import React, { useLayoutEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { queryKeys } from '../../../services/api/queryKeys';
import { timeAgo } from '../../../utils/dates';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead, NotificationItem } from '../services/notificationsService';

/** Icon + colour by notification type (free-form on the server, so matched loosely). */
function visualFor(type: string): { icon: string; color: string; soft: string } {
  const t = (type || '').toUpperCase();
  if (t.includes('LEAVE')) return { icon: 'event-available', color: '#14B8A6', soft: '#CCFBF1' };
  if (t.includes('EXAM') || t.includes('MARK') || t.includes('RESULT')) return { icon: 'edit-note', color: '#8B5CF6', soft: '#EDE9FE' };
  if (t.includes('ASSIGN') || t.includes('HOMEWORK')) return { icon: 'menu-book', color: '#F59E0B', soft: '#FEF3C7' };
  if (t.includes('ATTEND')) return { icon: 'how-to-reg', color: '#10B981', soft: '#D1FAE5' };
  if (t.includes('TIMETABLE') || t.includes('SUBSTITUTE')) return { icon: 'calendar-today', color: '#0EA5E9', soft: '#E0F2FE' };
  if (t.includes('ANNOUNCE') || t.includes('CIRCULAR')) return { icon: 'campaign', color: '#2563EB', soft: '#DBEAFE' };
  return { icon: 'notifications', color: colors.primary, soft: colors.primarySoft };
}

export function NotificationsScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: [...queryKeys.notificationsAll, 'list'],
    queryFn: () => fetchNotifications(30),
  });
  const unread = (data ?? []).filter((n) => !n.isRead).length;

  const refreshCounts = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardAll }); // dashboard: unread count
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: unread
        ? () => (
            <TouchableOpacity
              onPress={async () => {
                await markAllNotificationsRead().catch(() => {});
                refreshCounts();
              }}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={styles.markAll}>Mark all read</Text>
            </TouchableOpacity>
          )
        : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, unread]);

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorView onRetry={refetch} />;
  if (!data?.length) return <EmptyView icon="notifications-none" title="You're all caught up" message="New notifications will show up here." />;

  const onPress = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markNotificationRead(item.id).catch(() => {});
      refreshCounts();
    }
  };

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={data}
      keyExtractor={(item) => item.id}
      refreshing={isRefetching}
      onRefresh={refetch}
      renderItem={({ item }) => {
        const v = visualFor(item.type);
        return (
          <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.85} style={[styles.card, !item.isRead && styles.cardUnread]} accessibilityRole="button">
            <View style={[styles.icon, { backgroundColor: v.soft }]}>
              <Icon name={v.icon} size={22} color={v.color} />
            </View>
            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={2}>{item.title}</Text>
                {!item.isRead ? <View style={styles.dot} /> : null}
              </View>
              <Text style={styles.message} numberOfLines={3}>{item.message}</Text>
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  markAll: { ...typography.caption, fontWeight: '700', color: colors.primary },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow(1),
  },
  cardUnread: { backgroundColor: colors.primaryLight },
  icon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { ...typography.body, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  titleUnread: { fontWeight: '800' },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary, marginLeft: spacing.sm, marginTop: 5 },
  message: { ...typography.caption, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
  time: { ...typography.caption, fontSize: 11, color: colors.textSecondary, marginTop: spacing.xs },
});
