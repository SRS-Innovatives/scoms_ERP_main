import React, { useMemo, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, moduleColor, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Chip } from '../../../components/Chip';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { queryKeys } from '../../../services/api/queryKeys';
import { BedFilter, HostelBed, allocateBed, fetchBedPage, searchStudents, vacateBed } from '../services/hostelService';

const tint = moduleColor('hostel');
const HOSTEL_KEY = ['hostel'] as const;

function AllocateBedForm({ bed, onDone, onCancel }: { bed: HostelBed; onDone: () => void; onCancel: () => void }) {
  const [query, setQuery] = useState('');
  const q = useDebouncedValue(query.trim(), 300);
  const results = useQuery({ queryKey: [...HOSTEL_KEY, 'students', q], queryFn: () => searchStudents(q), enabled: q.length >= 2, staleTime: 30_000 });
  const allocate = useMutation({
    mutationFn: (studentId: string) => allocateBed(bed.id, studentId),
    onSuccess: onDone,
    onError: (err: any) => Alert.alert('Not allocated', err?.response?.data?.message || 'Could not allocate this bed.'),
  });

  const confirm = (s: { id: string; firstName: string; lastName: string }) =>
    Alert.alert('Allocate bed?', `${s.firstName} ${s.lastName} → ${bed.hostel.name}, Room ${bed.roomNumber} / Bed ${bed.bedNumber}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Allocate', onPress: () => allocate.mutate(s.id) },
    ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
      <View style={[styles.bedHero, { backgroundColor: tint.soft }]}>
        <Icon name="bed" size={28} color={tint.solid} />
        <View style={styles.flex}>
          <Text style={styles.title}>Room {bed.roomNumber} · Bed {bed.bedNumber}</Text>
          <Text style={styles.meta}>{bed.hostel.name}</Text>
        </View>
      </View>
      <View style={styles.search}>
        <Icon name="search" size={18} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Student name or roll no. (without a bed)"
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
          autoFocus
        />
      </View>
      {q.length < 2 ? <Text style={styles.hint}>Type at least 2 letters.</Text> : null}
      {results.isFetching && !results.data ? <Text style={styles.hint}>Searching…</Text> : null}
      {(results.data ?? []).map((s) => (
        <TouchableOpacity key={s.id} onPress={() => confirm(s)} style={styles.row} accessibilityRole="button" disabled={allocate.isPending}>
          <Avatar name={`${s.firstName} ${s.lastName}`} size={36} />
          <View style={styles.flex}>
            <Text style={styles.title}>{s.firstName} {s.lastName}</Text>
            <Text style={styles.meta}>Roll {s.rollNumber}</Text>
          </View>
          <Icon name="add-circle" size={24} color={tint.solid} />
        </TouchableOpacity>
      ))}
      {q.length >= 2 && results.data?.length === 0 ? <Text style={styles.hint}>No student without a bed matches.</Text> : null}
      <Button label="Cancel" variant="secondary" onPress={onCancel} style={styles.gap} />
    </ScrollView>
  );
}

/** Hostel beds — filtered and paged on the server, 50 at a time. */
export function HostelScreen() {
  const queryClient = useQueryClient();
  const [allocating, setAllocating] = useState<HostelBed | null>(null);
  const [filter, setFilter] = useState<BedFilter>('all');
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim(), 350);

  const beds = useInfiniteQuery({
    queryKey: [...HOSTEL_KEY, 'beds', filter, q],
    queryFn: ({ pageParam }) => fetchBedPage(pageParam, filter, q),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
  const rows = useMemo(() => (beds.data?.pages ?? []).flatMap((p) => p.beds), [beds.data]);
  const total = beds.data?.pages[0]?.total;

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: HOSTEL_KEY });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardAll }); // dashboard: occupied / vacant
  };

  const vacate = useMutation({
    mutationFn: (bed: HostelBed) => vacateBed(bed.id),
    onSuccess: refreshAll,
    onError: (err: any) => Alert.alert('Not vacated', err?.response?.data?.message || 'Could not vacate this bed.'),
  });

  if (allocating) {
    return (
      <AllocateBedForm
        bed={allocating}
        onCancel={() => setAllocating(null)}
        onDone={() => {
          setAllocating(null);
          refreshAll();
        }}
      />
    );
  }

  const confirmVacate = (bed: HostelBed) =>
    Alert.alert('Vacate bed?', `${bed.student?.firstName ?? 'The student'} leaves Room ${bed.roomNumber} / Bed ${bed.bedNumber}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Vacate', style: 'destructive', onPress: () => vacate.mutate(bed) },
    ]);

  const header = (
    <View>
      <View style={styles.search}>
        <Icon name="search" size={18} color={colors.textSecondary} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Room, bed or student" placeholderTextColor={colors.textSecondary} style={styles.searchInput} />
      </View>
      <View style={styles.chipRow}>
        {(['all', 'vacant', 'occupied'] as const).map((f) => (
          <Chip key={f} label={f === 'all' ? 'All' : f === 'vacant' ? 'Vacant' : 'Occupied'} selected={filter === f} onPress={() => setFilter(f)} style={styles.chip} />
        ))}
        {total !== undefined ? <Text style={styles.count}>{total} bed{total === 1 ? '' : 's'}</Text> : null}
      </View>
    </View>
  );

  if (beds.isError) return <ErrorView onRetry={beds.refetch} />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={rows}
      keyExtractor={(b) => b.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      refreshing={beds.isRefetching && !beds.isFetchingNextPage}
      onRefresh={() => {
        beds.refetch();
      }}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (beds.hasNextPage && !beds.isFetchingNextPage) beds.fetchNextPage();
      }}
      ListFooterComponent={beds.isFetchingNextPage ? <Text style={styles.hint}>Loading more…</Text> : undefined}
      ListEmptyComponent={
        beds.isLoading ? <LoadingView /> : <EmptyView icon="bed" title={q || filter !== 'all' ? 'No beds match' : 'No beds registered'} />
      }
      renderItem={({ item }) => (
        <View style={[styles.card, !item.isOccupied && styles.cardVacant]}>
          <View style={[styles.bedIcon, { backgroundColor: item.isOccupied ? tint.soft : colors.successLight }]}>
            <Icon name={item.isOccupied ? 'hotel' : 'bed'} size={22} color={item.isOccupied ? tint.solid : colors.success} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.title}>Room {item.roomNumber} · Bed {item.bedNumber}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {item.isOccupied && item.student
                ? `${item.student.firstName} ${item.student.lastName} · Roll ${item.student.rollNumber}`
                : `Vacant · ${item.hostel.name}`}
            </Text>
          </View>
          {item.isOccupied ? (
            <TouchableOpacity onPress={() => confirmVacate(item)} style={styles.actionGhost} accessibilityRole="button" disabled={vacate.isPending}>
              <Text style={styles.actionGhostText}>Vacate</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setAllocating(item)} style={[styles.action, { backgroundColor: tint.solid }]} accessibilityRole="button">
              <Text style={styles.actionText}>Allocate</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1, marginHorizontal: spacing.sm + 2 },
  list: { padding: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 },
  gap: { marginTop: spacing.md },
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.sm + 2, height: 44, marginBottom: spacing.sm, ...shadow(1) },
  searchInput: { flex: 1, marginLeft: spacing.xs, color: colors.textPrimary, paddingVertical: 0, ...typography.body },
  chipRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: spacing.sm },
  chip: { marginRight: spacing.sm, marginBottom: spacing.xs, paddingVertical: 6, paddingHorizontal: spacing.md },
  count: { ...typography.caption, fontWeight: '700', color: colors.textSecondary, marginLeft: 'auto' },
  hint: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginVertical: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm + 4, marginBottom: spacing.sm, ...shadow(1) },
  cardVacant: { borderLeftWidth: 4, borderLeftColor: colors.success },
  bedIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  action: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 7 },
  actionText: { ...typography.caption, fontWeight: '800', color: '#fff' },
  actionGhost: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6, borderWidth: 1.5, borderColor: colors.dangerLight },
  actionGhostText: { ...typography.caption, fontWeight: '800', color: colors.danger },
  bedHero: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm + 2, marginBottom: spacing.sm, ...shadow(1) },
});
