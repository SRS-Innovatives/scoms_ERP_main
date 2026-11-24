import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Linking, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery } from '@tanstack/react-query';
import { colors, moduleColors, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { useParent } from '../../../store/ParentContext';
import { queryKeys } from '../../../services/api/queryKeys';
import { StudyMaterial, fetchMaterials, markMaterialOpened } from '../services/materialsService';

const tint = moduleColors.materials;
const TYPE: Record<string, { icon: string; label: string }> = {
  PDF: { icon: 'picture-as-pdf', label: 'PDF' },
  PPT: { icon: 'slideshow', label: 'Slides' },
  DOC: { icon: 'description', label: 'Document' },
  VIDEO: { icon: 'smart-display', label: 'Video' },
  LINK: { icon: 'link', label: 'Link' },
};
const typeOf = (t: string) => TYPE[t] ?? { icon: 'insert-drive-file', label: t };

const when = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/** Study materials teachers shared for the student's subjects (the active child's, for a parent). */
export function MaterialsScreen() {
  const { isParent } = useParent();
  const q = useQuery({ queryKey: queryKeys.materials, queryFn: fetchMaterials });
  const [subject, setSubject] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const subjects = useMemo(() => [...new Set((q.data ?? []).map((m) => m.subject?.name).filter(Boolean) as string[])].sort(), [q.data]);
  const list = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.data ?? [])
      .filter((m) => !subject || m.subject?.name === subject)
      .filter((m) => !s || `${m.title} ${m.description ?? ''} ${m.subject?.name ?? ''}`.toLowerCase().includes(s));
  }, [q.data, subject, search]);

  const open = (m: StudyMaterial) => {
    if (!m.fileUrl) return Alert.alert('Not available', 'This material has no file or link attached.');
    if (!isParent) markMaterialOpened(m.id).catch(() => {}); // the teacher's "who opened it" — students only
    return Linking.openURL(m.fileUrl).catch(() => Alert.alert("Can't open", 'No app on this phone can open this file or link.'));
  };

  if (q.isLoading) return <LoadingView />;
  if (q.isError) return <ErrorView onRetry={q.refetch} />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={list}
      keyExtractor={(m) => m.id}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => { q.refetch(); }} colors={[tint.solid]} />}
      ListHeaderComponent={
        (q.data?.length ?? 0) > 0 ? (
          <View>
            <View style={styles.search}>
              <Icon name="search" size={18} color={colors.textSecondary} />
              <TextInput value={search} onChangeText={setSearch} placeholder="Search materials" placeholderTextColor={colors.textSecondary} style={styles.searchInput} />
            </View>
            {subjects.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {[null, ...subjects].map((s) => {
                  const on = subject === s;
                  return (
                    <TouchableOpacity key={s ?? 'all'} onPress={() => setSubject(s)} style={[styles.chip, on && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{s ?? 'All subjects'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>
        ) : undefined
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Icon name="library-books" size={44} color={tint.solid} />
          <Text style={styles.emptyTitle}>{q.data?.length ? 'Nothing matches' : 'No study materials yet'}</Text>
          <Text style={styles.emptyText}>{q.data?.length ? 'Try another subject or search.' : 'Notes, videos and links your teachers share will appear here.'}</Text>
        </View>
      }
      renderItem={({ item }) => {
        const t = typeOf(item.fileType);
        const by = item.staff ? `${item.staff.firstName} ${item.staff.lastName}`.trim() : null;
        return (
          <TouchableOpacity style={styles.card} onPress={() => open(item)} activeOpacity={0.85} accessibilityRole="link" accessibilityLabel={`Open ${item.title}`}>
            <View style={[styles.icon, { backgroundColor: tint.soft }]}>
              <Icon name={t.icon} size={24} color={tint.solid} />
            </View>
            <View style={styles.body}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.meta} numberOfLines={1}>{[item.subject?.name, by, when(item.createdAt)].filter(Boolean).join(' · ')}</Text>
              {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}
            </View>
            <View style={styles.right}>
              <Text style={[styles.badge, { color: tint.solid, backgroundColor: tint.soft }]}>{t.label}</Text>
              <Icon name="open-in-new" size={18} color={colors.textSecondary} style={styles.openIcon} />
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 },
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.sm + 2, height: 44, marginBottom: spacing.sm, ...shadow(1) },
  searchInput: { flex: 1, marginLeft: spacing.xs, color: colors.textPrimary, paddingVertical: 0, ...typography.body },
  chips: { paddingBottom: spacing.sm },
  chip: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 7, backgroundColor: colors.surface, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: tint.solid, borderColor: tint.solid },
  chipText: { ...typography.caption, fontWeight: '700', color: colors.textPrimary },
  chipTextOn: { color: '#fff' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm + 2, ...shadow(1) },
  icon: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, marginHorizontal: spacing.sm + 2 },
  title: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  desc: { ...typography.caption, color: colors.textPrimary, marginTop: spacing.xs },
  right: { alignItems: 'flex-end' },
  badge: { ...typography.overline, fontSize: 9, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, overflow: 'hidden' },
  openIcon: { marginTop: spacing.sm },
  empty: { alignItems: 'center', padding: spacing.xl },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
});
