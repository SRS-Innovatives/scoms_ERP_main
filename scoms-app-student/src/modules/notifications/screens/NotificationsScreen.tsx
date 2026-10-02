import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Card } from '../../../components/Card';
import { fetchNotifications, markNotificationRead, NotificationItem } from '../services/notificationsService';

export function NotificationsScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => fetchNotifications(30),
  });

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorView onRetry={refetch} />;
  if (!data?.length) return <EmptyView title="No notifications yet" />;

  const onPress = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markNotificationRead(item.id).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => onPress(item)}>
          <Card style={[styles.card, !item.isRead && styles.unread]}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
          </Card>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, backgroundColor: colors.background },
  card: { marginBottom: spacing.sm },
  unread: { borderColor: colors.primary },
  title: { ...typography.h3, color: colors.textPrimary },
  message: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
