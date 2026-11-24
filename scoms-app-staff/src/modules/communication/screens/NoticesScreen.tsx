import React, { useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, moduleColor, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { Button } from '../../../components/Button';
import { Chip } from '../../../components/Chip';
import { TextField } from '../../../components/TextField';
import { useAuth } from '../../../store/AuthContext';
import { queryKeys } from '../../../services/api/queryKeys';
import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';
import { Announcement, Circular, NewAnnouncement, createAnnouncement, fetchAnnouncements, fetchCirculars } from '../services/communicationService';

const tint = moduleColor('announcements');
type Tab = 'announcements' | 'circulars';

/** Roles holding announcements.create (shared/permissions/permissionMatrix.js). */
const CAN_POST = ['TEACHER'];

const AUDIENCES: { key: NewAnnouncement['targetRole']; label: string }[] = [
  { key: 'STUDENTS', label: 'Students' },
  { key: 'PARENTS', label: 'Parents' },
  { key: 'STAFF', label: 'Staff' },
  { key: 'ALL', label: 'Everyone' },
];
const AUDIENCE_LABEL: Record<string, string> = { STUDENTS: 'Students', PARENTS: 'Parents', STAFF: 'Staff', ALL: 'Everyone' };
const PRIORITIES: { key: NewAnnouncement['priority']; label: string }[] = [
  { key: 'NORMAL', label: 'Normal' },
  { key: 'HIGH', label: 'Important' },
  { key: 'URGENT', label: 'Urgent' },
];

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
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

interface MySection {
  sectionId: string;
  className: string;
}

/** Sections this teacher teaches (for "only this class"); empty if the homework module is off. */
async function fetchMySections(): Promise<MySection[]> {
  try {
    const { data } = await apiClient.get<ApiEnvelope<MySection[]>>('/assignments/my-classes');
    const seen = new Map<string, MySection>();
    (data.data ?? []).forEach((c) => seen.set(c.sectionId, { sectionId: c.sectionId, className: c.className }));
    return [...seen.values()];
  } catch {
    return [];
  }
}

function Expandable({ text, lines = 3 }: { text: string; lines?: number }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 160;
  return (
    <>
      <Text style={styles.body} numberOfLines={open ? undefined : lines}>
        {text}
      </Text>
      {long ? (
        <Text style={styles.more} onPress={() => setOpen((v) => !v)}>
          {open ? 'Show less' : 'Read more'}
        </Text>
      ) : null}
    </>
  );
}

function AnnouncementCard({ a, myUserId }: { a: Announcement; myUserId?: string }) {
  const p = PRIORITY[a.priority];
  const mine = !!myUserId && a.authorId === myUserId;
  const scope = [AUDIENCE_LABEL[a.targetRole] ?? a.targetRole, a.targetSection?.name ?? a.targetCourse?.name].filter(Boolean).join(' · ');
  return (
    <View style={[styles.card, p && [styles.cardFlag, { borderLeftColor: p.color }]]}>
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
      {mine ? (
        <View style={styles.mine}>
          <Icon name="send" size={13} color={colors.primaryDark} />
          <Text style={styles.mineText}>You posted to {scope}</Text>
        </View>
      ) : null}
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
            {new Date(c.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>
      </View>
      {c.description ? <Expandable text={c.description} /> : null}
      {c.issuedBy || c.hasAttachment ? (
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
      ) : null}
    </View>
  );
}

function PostNoticeForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState<NewAnnouncement['targetRole']>('STUDENTS');
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [priority, setPriority] = useState<NewAnnouncement['priority']>('NORMAL');
  const sections = useQuery({ queryKey: ['staff', 'mySections'], queryFn: fetchMySections, staleTime: 10 * 60_000 });
  const classScoped = targetRole === 'STUDENTS' || targetRole === 'PARENTS';

  const post = useMutation({
    mutationFn: () =>
      createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        targetRole,
        priority,
        ...(classScoped && sectionId ? { targetSectionId: sectionId } : {}),
      }),
    onSuccess: () => {
      Alert.alert('Notice posted', 'It is now visible to the chosen audience.');
      onDone();
    },
    onError: (err: any) => Alert.alert('Not posted', err?.response?.data?.message || 'Could not post this notice.'),
  });

  const confirm = () => {
    const scope = classScoped && sectionId ? sections.data?.find((x) => x.sectionId === sectionId)?.className : 'the whole institution';
    Alert.alert('Post notice?', `To ${AUDIENCE_LABEL[targetRole]} · ${scope}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Post', onPress: () => post.mutate() },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.formLabel}>Who should see it?</Text>
        <View style={styles.chipRow}>
          {AUDIENCES.map((a) => (
            <Chip key={a.key} label={a.label} selected={targetRole === a.key} onPress={() => setTargetRole(a.key)} style={styles.formChip} />
          ))}
        </View>

        {classScoped && sections.data?.length ? (
          <>
            <Text style={styles.formLabel}>Which class?</Text>
            <View style={styles.chipRow}>
              <Chip label="All classes" selected={sectionId === null} onPress={() => setSectionId(null)} style={styles.formChip} />
              {sections.data.map((c) => (
                <Chip key={c.sectionId} label={c.className} selected={sectionId === c.sectionId} onPress={() => setSectionId(c.sectionId)} style={styles.formChip} />
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.formLabel}>Priority</Text>
        <View style={styles.chipRow}>
          {PRIORITIES.map((p) => (
            <Chip key={p.key} label={p.label} selected={priority === p.key} onPress={() => setPriority(p.key)} style={styles.formChip} />
          ))}
        </View>

        <TextField label="Title" icon="title" value={title} onChangeText={setTitle} maxLength={200} placeholder="e.g. Science project due Monday" />
        <TextField label="Message" icon="notes" value={content} onChangeText={setContent} multiline placeholder="Write the notice…" />

        <Button label="Post notice" icon="campaign" onPress={confirm} loading={post.isPending} disabled={!title.trim() || !content.trim()} color={tint.solid} />
        <Button label="Cancel" variant="secondary" onPress={onCancel} style={styles.formGap} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Announcements (for staff / everyone, plus my own posts) and official circulars. */
export function NoticesScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canPost = !!user && CAN_POST.includes(user.role);
  const [posting, setPosting] = useState(false);
  const [tab, setTab] = useState<Tab>('announcements');
  // Each tab only loads when opened; switching back is instant (cached)
  const announcementsQuery = useQuery({ queryKey: queryKeys.announcements, queryFn: fetchAnnouncements, enabled: tab === 'announcements' && !posting });
  const circularsQuery = useQuery({ queryKey: queryKeys.circulars, queryFn: fetchCirculars, enabled: tab === 'circulars' && !posting });
  const q = tab === 'announcements' ? announcementsQuery : circularsQuery;

  if (posting) {
    return (
      <PostNoticeForm
        onCancel={() => setPosting(false)}
        onDone={() => {
          setPosting(false);
          setTab('announcements');
          queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
        }}
      />
    );
  }

  const header = (
    <View>
      <View style={styles.tabs}>
        {(['announcements', 'circulars'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
          >
            <Icon name={t === 'announcements' ? 'campaign' : 'description'} size={16} color={tab === t ? '#fff' : colors.textSecondary} />
            <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t === 'announcements' ? 'Announcements' : 'Circulars'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {canPost && tab === 'announcements' ? (
        <Button label="Post a notice" icon="add-comment" onPress={() => setPosting(true)} color={tint.solid} style={styles.postBtn} />
      ) : null}
    </View>
  );

  if (q.isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>{header}</View>
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
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => {
            q.refetch();
          }} colors={[tint.solid]} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Icon name={tab === 'announcements' ? 'campaign' : 'description'} size={40} color={tint.solid} />
          <Text style={styles.emptyTitle}>{tab === 'announcements' ? 'No announcements' : 'No circulars'}</Text>
          <Text style={styles.emptyText}>New notices from the institution will appear here.</Text>
        </View>
      }
      renderItem={({ item }) =>
        tab === 'announcements' ? <AnnouncementCard a={item as Announcement} myUserId={user?.id} /> : <CircularCard c={item as Circular} />
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
  tabOn: { backgroundColor: tint.solid },
  tabText: { fontWeight: '700', color: colors.textSecondary, marginLeft: 6, fontSize: 13 },
  tabTextOn: { color: '#fff' },
  postBtn: { marginBottom: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm + 4, ...shadow(1) },
  cardFlag: { borderLeftWidth: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  iconChip: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm + 2 },
  title: { ...typography.h3, color: colors.textPrimary },
  meta: { ...typography.caption, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, marginLeft: spacing.sm },
  badgeText: { ...typography.overline, fontSize: 9 },
  body: { ...typography.body, color: colors.textPrimary, marginTop: spacing.sm, lineHeight: 21 },
  more: { fontWeight: '700', marginTop: spacing.xs, color: tint.solid },
  mine: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, alignSelf: 'flex-start', backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  mineText: { ...typography.caption, fontWeight: '700', color: colors.primaryDark, marginLeft: 4 },
  footer: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  footerItem: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  footerText: { ...typography.caption, color: colors.textSecondary, marginLeft: 4, flex: 1 },
  empty: { alignItems: 'center', padding: spacing.xl },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  formLabel: { ...typography.caption, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  formChip: { marginRight: spacing.sm, marginBottom: spacing.sm, paddingVertical: 7, paddingHorizontal: spacing.md },
  formGap: { marginTop: spacing.md },
});
