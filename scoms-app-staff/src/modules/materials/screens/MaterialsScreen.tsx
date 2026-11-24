import React, { useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, moduleColor, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Chip } from '../../../components/Chip';
import { TextField } from '../../../components/TextField';
import { useAuth } from '../../../store/AuthContext';
import { queryKeys } from '../../../services/api/queryKeys';
import { shortDate, timeAgo } from '../../../utils/dates';
import {
  MATERIAL_TYPES,
  Material,
  MaterialType,
  MyMaterialStats,
  deleteMaterial,
  fetchMaterialDownloads,
  fetchMaterials,
  fetchMyMaterialStats,
  fetchMySubjects,
  shareMaterial,
} from '../services/materialsService';

const tint = moduleColor('materials');
/** Roles holding materials.upload */
const CAN_SHARE = ['TEACHER', 'HOD'];
type Tab = 'mine' | 'library';

const TYPE_ICON: Record<string, string> = { PDF: 'picture-as-pdf', PPT: 'slideshow', DOC: 'description', VIDEO: 'smart-display', LINK: 'link' };
const iconFor = (t: string) => TYPE_ICON[t] ?? 'insert-drive-file';

const openLink = (url: string | null) => {
  if (!url) return Alert.alert('No file', 'This material has no link to open.');
  return Linking.openURL(url).catch(() => Alert.alert("Can't open", 'No app on this phone can open this link.'));
};

function ShareForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const subjects = useQuery({ queryKey: [...queryKeys.materials, 'mySubjects'], queryFn: fetchMySubjects, staleTime: 10 * 60_000 });
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [fileType, setFileType] = useState<MaterialType>('LINK');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const subject = subjectId ?? subjects.data?.[0]?.id ?? null;
  const urlOk = /^https?:\/\/\S+\.\S+/i.test(url.trim());

  const share = useMutation({
    mutationFn: () => shareMaterial({ title: title.trim(), description: description.trim() || undefined, subjectId: subject!, fileType, fileUrl: url.trim() }),
    onSuccess: () => {
      Alert.alert('Shared', 'Students of this subject can open it now.');
      onDone();
    },
    onError: (err: any) => Alert.alert('Not shared', err?.response?.data?.message || 'Could not share this material.'),
  });

  if (subjects.isLoading) return <LoadingView />;
  if (subjects.isError) return <ErrorView onRetry={subjects.refetch} />;
  if (!subjects.data?.length) {
    return (
      <View style={styles.container}>
        <EmptyView icon="menu-book" title="No subjects assigned" message="You can share materials for subjects you teach." />
        <Button label="Back" variant="secondary" onPress={onCancel} style={styles.backBtn} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Subject</Text>
        <View style={styles.chipRow}>
          {subjects.data.map((s) => (
            <Chip key={s.id} label={s.name} selected={subject === s.id} onPress={() => setSubjectId(s.id)} style={styles.chip} />
          ))}
        </View>
        <Text style={styles.label}>Type</Text>
        <View style={styles.chipRow}>
          {MATERIAL_TYPES.map((t) => (
            <Chip key={t} label={t === 'LINK' ? 'Web link' : t} selected={fileType === t} onPress={() => setFileType(t)} style={styles.chip} />
          ))}
        </View>
        <TextField label="Title" icon="title" value={title} onChangeText={setTitle} maxLength={200} placeholder="e.g. Chapter 5 notes" />
        <TextField
          label="Link"
          icon="link"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://drive.google.com/…"
          error={url.trim() && !urlOk ? 'Enter a full link starting with https://' : undefined}
        />
        <TextField label="Description (optional)" icon="notes" value={description} onChangeText={setDescription} multiline />
        <Text style={styles.hint}>Paste a Google Drive, YouTube or website link. To upload a file from your computer, use the SCOMS web portal.</Text>
        <Button label="Share with students" icon="share" onPress={() => share.mutate()} loading={share.isPending} disabled={!subject || !title.trim() || !urlOk} color={tint.solid} />
        <Button label="Cancel" variant="secondary" onPress={onCancel} style={styles.gap} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DownloadsView({ id, onBack }: { id: string; onBack: () => void }) {
  const q = useQuery({ queryKey: [...queryKeys.materials, 'downloads', id], queryFn: () => fetchMaterialDownloads(id) });
  const [tab, setTab] = useState<'opened' | 'not'>('opened');
  if (q.isLoading) return <LoadingView />;
  if (q.isError || !q.data) return <ErrorView onRetry={q.refetch} />;
  const d = q.data;
  const rows = tab === 'opened' ? d.opened : d.notOpened;
  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={rows}
      keyExtractor={(s) => s.id}
      ListHeaderComponent={
        <View>
          <TouchableOpacity onPress={onBack} style={styles.back} accessibilityRole="button">
            <Icon name="arrow-back" size={18} color={colors.primary} />
            <Text style={styles.backText}>My materials</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>{d.material.title}</Text>
          <Text style={styles.meta}>{[d.material.subject, `Shared ${shortDate(d.material.sharedAt)}`].filter(Boolean).join(' · ')}</Text>
          <View style={styles.tabs}>
            <TouchableOpacity onPress={() => setTab('opened')} style={[styles.tab, tab === 'opened' && styles.tabOn]} accessibilityRole="tab">
              <Text style={[styles.tabText, tab === 'opened' && styles.tabTextOn]}>Opened ({d.opened.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTab('not')} style={[styles.tab, tab === 'not' && styles.tabOn]} accessibilityRole="tab">
              <Text style={[styles.tabText, tab === 'not' && styles.tabTextOn]}>Not yet ({d.notOpened.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      }
      ListEmptyComponent={<Text style={styles.noMatch}>{tab === 'opened' ? 'No student has opened it yet.' : 'Every student has opened it.'}</Text>}
      renderItem={({ item }) => (
        <View style={styles.studentRow}>
          <Avatar name={`${item.firstName} ${item.lastName}`} size={34} />
          <View style={styles.flex}>
            <Text style={styles.name} numberOfLines={1}>{`${item.firstName} ${item.lastName}`.trim()}</Text>
            <Text style={styles.meta}>Roll {item.rollNumber}{item.section ? ` · ${item.section.name}` : ''}</Text>
          </View>
          {'openCount' in item ? (
            <Text style={styles.opens}>{(item as any).openCount}× · {timeAgo((item as any).lastOpenedAt)}</Text>
          ) : null}
        </View>
      )}
    />
  );
}

function MineCard({ m, onOpen, onDelete }: { m: MyMaterialStats; onOpen: () => void; onDelete: () => void }) {
  const pct = m.students ? Math.round((m.openedBy / m.students) * 100) : null;
  return (
    <TouchableOpacity style={styles.card} onPress={onOpen} activeOpacity={0.85} accessibilityRole="button">
      <View style={styles.cardTop}>
        <View style={[styles.iconChip, { backgroundColor: tint.soft }]}>
          <Icon name={iconFor(m.fileType)} size={22} color={tint.solid} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={2}>{m.title}</Text>
          <Text style={styles.meta}>{[m.subject, shortDate(m.sharedAt)].filter(Boolean).join(' · ')}</Text>
        </View>
        <TouchableOpacity onPress={onDelete} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Delete ${m.title}`}>
          <Icon name="delete-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct ?? 0}%`, backgroundColor: tint.solid }]} />
        </View>
        <Text style={styles.progressText}>
          {m.students !== null ? `${m.openedBy}/${m.students} opened` : `${m.openedBy} opened`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function LibraryCard({ m, mine }: { m: Material; mine: boolean }) {
  const by = m.staff ? `${m.staff.firstName} ${m.staff.lastName}`.trim() : null;
  return (
    <TouchableOpacity style={styles.card} onPress={() => openLink(m.fileUrl)} activeOpacity={0.85} accessibilityRole="link">
      <View style={styles.cardTop}>
        <View style={[styles.iconChip, { backgroundColor: tint.soft }]}>
          <Icon name={iconFor(m.fileType)} size={22} color={tint.solid} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={2}>{m.title}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {[m.subject?.name, mine ? 'You' : by, shortDate(m.createdAt)].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Icon name="open-in-new" size={20} color={colors.textSecondary} />
      </View>
      {m.description ? <Text style={styles.desc} numberOfLines={2}>{m.description}</Text> : null}
    </TouchableOpacity>
  );
}

/** Study materials: mine (with who opened them) and the institution library. */
export function MaterialsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canShare = !!user && CAN_SHARE.includes(user.role);
  const [tab, setTab] = useState<Tab>(canShare ? 'mine' : 'library');
  const [sharing, setSharing] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const mineQ = useQuery({ queryKey: [...queryKeys.materials, 'mine'], queryFn: fetchMyMaterialStats, enabled: canShare && tab === 'mine' });
  const libQ = useQuery({ queryKey: [...queryKeys.materials, 'library'], queryFn: fetchMaterials, enabled: tab === 'library' });

  const remove = useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.materials }),
    onError: (err: any) => Alert.alert('Not deleted', err?.response?.data?.message || 'Could not delete this material.'),
  });

  if (sharing) {
    return (
      <ShareForm
        onCancel={() => setSharing(false)}
        onDone={() => {
          setSharing(false);
          setTab('mine');
          queryClient.invalidateQueries({ queryKey: queryKeys.materials });
        }}
      />
    );
  }
  if (detail) return <DownloadsView id={detail} onBack={() => setDetail(null)} />;

  const q = tab === 'mine' ? mineQ : libQ;
  const header = (
    <View>
      {canShare ? (
        <View style={styles.tabs}>
          {(['mine', 'library'] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: tab === t }}>
              <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t === 'mine' ? 'My materials' : 'Library'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      {canShare ? <Button label="Share a material" icon="add-link" onPress={() => setSharing(true)} color={tint.solid} style={styles.headerBtn} /> : null}
    </View>
  );

  if (q.isError) return <ErrorView onRetry={q.refetch} />;

  const confirmDelete = (m: MyMaterialStats) =>
    Alert.alert('Delete material?', `"${m.title}" will no longer be available to students.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(m.id) },
    ]);

  return (
    <FlatList<MyMaterialStats | Material>
      style={styles.container}
      contentContainerStyle={styles.list}
      data={(q.data ?? []) as (MyMaterialStats | Material)[]}
      keyExtractor={(m) => m.id}
      refreshing={q.isRefetching}
      onRefresh={() => {
        q.refetch();
      }}
      ListHeaderComponent={header}
      ListEmptyComponent={
        q.isLoading ? (
          <LoadingView />
        ) : (
          <EmptyView
            icon="library-books"
            title={tab === 'mine' ? "You haven't shared anything yet" : 'No materials yet'}
            message={tab === 'mine' ? 'Share notes, videos or links for your subjects.' : 'Materials shared by staff appear here.'}
          />
        )
      }
      renderItem={({ item }) =>
        tab === 'mine' ? (
          <MineCard m={item as MyMaterialStats} onOpen={() => setDetail(item.id)} onDelete={() => confirmDelete(item as MyMaterialStats)} />
        ) : (
          <LibraryCard m={item as Material} mine={(item as Material).staffId === user?.staff?.id} />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1, marginHorizontal: spacing.sm + 2 },
  list: { padding: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 },
  form: { padding: spacing.md, paddingBottom: spacing.xl },
  headerBtn: { marginBottom: spacing.md },
  backBtn: { margin: spacing.md },
  label: { ...typography.caption, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  gap: { marginTop: spacing.md },
  hint: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  chip: { marginRight: spacing.sm, marginBottom: spacing.sm, paddingVertical: 6, paddingHorizontal: spacing.md },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.full, padding: 4, marginBottom: spacing.md, ...shadow(1) },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm + 2, borderRadius: radius.full },
  tabOn: { backgroundColor: tint.solid },
  tabText: { fontWeight: '700', color: colors.textSecondary, fontSize: 13 },
  tabTextOn: { color: '#fff' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm + 4, ...shadow(1) },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  iconChip: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  name: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  desc: { ...typography.caption, color: colors.textPrimary, marginTop: spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressText: { ...typography.caption, fontWeight: '700', color: colors.textSecondary, marginLeft: spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  backText: { ...typography.caption, fontWeight: '700', color: colors.primary, marginLeft: 4 },
  detailTitle: { ...typography.h2, color: colors.textPrimary },
  studentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm + 2, marginBottom: spacing.sm, ...shadow(1) },
  opens: { ...typography.caption, color: colors.textSecondary },
  noMatch: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg },
});
