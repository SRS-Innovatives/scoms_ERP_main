import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery } from '@tanstack/react-query';
import { colors, moduleColors, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { queryKeys } from '../../../services/api/queryKeys';
import { Announcement, Circular, fetchAnnouncements, fetchCirculars } from '../services/communicationService';

const tint = moduleColors.announcements;
type Tab = 'announcements' | 'circulars';

const PRIORITY: Record<string, { color: string; bg: string; label: string; icon: string } | undefined> = {
  URGENT: { color: colors.danger, bg: colors.dangerLight, label: 'URGENT', icon: 'priority-high' },
  HIGH: { color: '#B45309', bg: colors.warningLight, label: 'IMPORTANT', icon: 'star' },
};

const when = (iso: string) => {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

function Expandable({ text, lines = 3 }: { text: string; lines?: number }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 160;
  return (
    <>
      <Text style={styles.body} numberOfLines={open ? undefined : lines}>
        {text}
      </Text>
      {long ? (
        <Text style={[styles.more, { color: tint.solid }]} onPress={() => setOpen((v) => !v)}>
          {open ? 'Show less' : 'Read more'}
        </Text>
      ) : null}
    </>
  );
}

function AnnouncementCard({ a }: { a: Announcement }) {
  const p = PRIORITY[a.priority];
  return (
    <View style={[styles.card, p && { borderLeftWidth: 4, borderLeftColor: p.color }]}>
      <View style={styles.cardTop}>
        <View style={[styles.iconChip, { backgroundColor: p?.bg ?? tint.soft }]}>
          <Icon name={p?.icon ?? 'campaign'} size={18} color={p?.color ?? tint.solid} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>{a.title}</Text>
          <Text style={styles.meta}>
            {when(a.createdAt)}
            {a.institutionId === null ? ' · SCOMS' : ''}
          </Text>
        </View>
        {p ? (
          <View style={[styles.badge, { backgroundColor: p.bg }]}>
            <Text style={[styles.badgeText, { color: p.color }]}>{p.label}</Text>
          </View>
        ) : null}
      </View>
      <Expandable text={a.content} />
    </View>
  );
}

function CircularCard({ c }: { c: Circular }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.iconChip, { backgroundColor: tint.soft }]}>
          <Icon name="description" size={18} color={tint.solid} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>{c.title}</Text>
          <Text style={styles.meta}>
            {c.refNo ? `Ref ${c.refNo} · ` : ''}
            {new Date(c.issueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>
      </View>
      {c.description ? <Expandable text={c.description} /> : null}
      <View style={styles.footer}>
        {c.issuedBy ? (
          <View style={styles.footerItem}>
            <Icon name="person-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.footerText}>{c.issuedBy}</Text>
          </View>
        ) : null}
        {c.hasAttachment ? (
          <View style={styles.footerItem}>
            <Icon name="attach-file" size={14} color={colors.textSecondary} />
            <Text style={styles.footerText} numberOfLines={1}>
              {c.attachmentName ?? 'Attachment'} · on the website
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function AnnouncementsScreen() {
  const [tab, setTab] = useState<Tab>('announcements');
  // Each tab only loads when opened; switching back is instant (cached)
  const announcementsQuery = useQuery({ queryKey: queryKeys.announcements, queryFn: fetchAnnouncements, enabled: tab === 'announcements' });
  const circularsQuery = useQuery({ queryKey: queryKeys.circulars, queryFn: fetchCirculars, enabled: tab === 'circulars' });
  const q = tab === 'announcements' ? announcementsQuery : circularsQuery;

  const Tabs = (
    <View style={styles.tabs}>
      {(['announcements', 'circulars'] as const).map((t) => (
        <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && { backgroundColor: tint.solid }]} accessibilityRole="tab" accessibilityState={{ selected: tab === t }}>
          <Icon name={t === 'announcements' ? 'campaign' : 'description'} size={16} color={tab === t ? '#fff' : colors.textSecondary} />
          <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t === 'announcements' ? 'Announcements' : 'Circulars'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (q.isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>{Tabs}</View>
        <LoadingView />
      </View>
    );
  }
  if (q.isError) return <ErrorView onRetry={q.refetch} />;

  return (
    <FlatList<Announcement | Circular>
      style={styles.container}
      contentContainerStyle={styles.content}
      data={(q.data ?? []) as (Announcement | Circular)[]}
      keyExtractor={(i) => i.id}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => { q.refetch(); }} colors={[tint.solid]} />}
      ListHeaderComponent={Tabs}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Icon name={tab === 'announcements' ? 'campaign' : 'description'} size={40} color={tint.solid} />
          <Text style={styles.emptyTitle}>{tab === 'announcements' ? 'No announcements' : 'No circulars'}</Text>
          <Text style={styles.emptyText}>New updates from the school will appear here.</Text>
        </View>
      }
      renderItem={({ item }) =>
        tab === 'announcements' ? <AnnouncementCard a={item as Announcement} /> : <CircularCard c={item as Circular} />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  flex: { flex: 1 },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.full, padding: 4, marginBottom: spacing.md, ...shadow(1) },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm + 2, borderRadius: radius.full },
  tabText: { fontWeight: '700', color: colors.textSecondary, marginLeft: 6, fontSize: 13 },
  tabTextOn: { color: '#fff' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm + 4, ...shadow(1) },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  iconChip: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm + 2 },
  title: { ...typography.h3, color: colors.textPrimary },
  meta: { ...typography.caption, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, marginLeft: spacing.sm },
  badgeText: { ...typography.overline, fontSize: 9 },
  body: { ...typography.body, color: colors.textPrimary, marginTop: spacing.sm, lineHeight: 21 },
  more: { fontWeight: '700', marginTop: spacing.xs },
  footer: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  footerItem: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  footerText: { ...typography.caption, color: colors.textSecondary, marginLeft: 4, flex: 1 },
  empty: { alignItems: 'center', padding: spacing.xl },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
});
