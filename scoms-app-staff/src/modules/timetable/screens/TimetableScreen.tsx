import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery } from '@tanstack/react-query';
import { avatarPalette, colors, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { colorForName } from '../../../components/Avatar';
import { TimetableEntry, fetchMyTimetable } from '../services/timetableService';

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const todayKey = () => DAY_ORDER[(new Date().getDay() + 6) % 7];
const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export function TimetableScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['staff', 'timetable'],
    queryFn: fetchMyTimetable,
    staleTime: 10 * 60_000,
  });

  const byDay = useMemo(() => {
    const map = new Map<string, TimetableEntry[]>();
    (data ?? []).forEach((e) => {
      if (!map.has(e.dayOfWeek)) map.set(e.dayOfWeek, []);
      map.get(e.dayOfWeek)!.push(e);
    });
    map.forEach((list) => list.sort((a, b) => a.period - b.period));
    return map;
  }, [data]);

  // Mon–Sat always; Sunday only if something is scheduled on it
  const days = DAY_ORDER.filter((d) => d !== 'SUNDAY' || byDay.has('SUNDAY'));
  const [day, setDay] = useState(() => (todayKey() === 'SUNDAY' ? 'MONDAY' : todayKey()));

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorView onRetry={refetch} />;
  if (!data?.length) return <EmptyView icon="calendar-today" title="No timetable published yet" message="Your periods appear here once the timetable is published." />;

  const entries = byDay.get(day) ?? [];
  const isToday = day === todayKey();
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const teaching = entries.filter((e) => e.subject).length;

  return (
    <View style={styles.container}>
      <View style={styles.dayBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
          {days.map((d) => {
            const selected = d === day;
            const n = byDay.get(d)?.length ?? 0;
            return (
              <TouchableOpacity
                key={d}
                onPress={() => setDay(d)}
                style={[styles.dayChip, selected && styles.dayChipOn]}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.dayText, selected && styles.onBrand]}>{d.slice(0, 3)}</Text>
                <Text style={[styles.dayCount, selected && styles.onBrandMuted]}>{n ? `${n}` : '–'}</Text>
                {d === todayKey() ? <View style={[styles.todayDot, selected && styles.todayDotOn]} /> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={entries}
        keyExtractor={(item) => item.id}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <Text style={styles.summary}>
            {entries.length
              ? `${teaching} class${teaching === 1 ? '' : 'es'}${isToday ? ' today' : ''} · ${entries.length} period${entries.length === 1 ? '' : 's'}`
              : ''}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.free}>
            <Icon name="free-breakfast" size={36} color={colors.primary} />
            <Text style={styles.freeText}>No periods on {day.charAt(0) + day.slice(1).toLowerCase()}.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const subject = item.subject?.name ?? item.label ?? 'Free period';
          const color = item.subject ? colorForName(item.subject.name) : avatarPalette[0];
          const live = isToday && minutesOf(item.startTime) <= nowMin && nowMin < minutesOf(item.endTime);
          const done = isToday && minutesOf(item.endTime) <= nowMin;
          return (
            <View style={[styles.card, live && styles.cardLive, done && styles.cardDone]}>
              <View style={styles.time}>
                <Text style={styles.start}>{item.startTime}</Text>
                <Text style={styles.end}>{item.endTime}</Text>
              </View>
              <View style={[styles.bar, { backgroundColor: item.subject ? color : colors.border }]} />
              <View style={styles.body}>
                <Text style={[styles.subject, !item.subject && styles.breakText]} numberOfLines={1}>{subject}</Text>
                {item.subject ? (
                  <Text style={styles.meta} numberOfLines={1}>
                    {item.timetable.section.semester.course.name} · {item.timetable.section.name}
                    {item.roomNumber ? `  ·  Room ${item.roomNumber}` : ''}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.period}>{live ? 'NOW' : `P${item.period}`}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  dayBar: { backgroundColor: colors.surface, ...shadow(1) },
  dayRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  dayChip: {
    width: 54,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  dayChipOn: { backgroundColor: colors.primary },
  dayText: { ...typography.caption, fontWeight: '800', color: colors.textPrimary },
  dayCount: { ...typography.caption, fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  onBrand: { color: '#fff' },
  onBrandMuted: { color: colors.textOnDarkMuted },
  todayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 3 },
  todayDotOn: { backgroundColor: '#fff' },
  list: { padding: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 },
  summary: { ...typography.caption, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm },
  free: { alignItems: 'center', marginTop: spacing.xl },
  freeText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    ...shadow(1),
  },
  cardLive: { borderWidth: 2, borderColor: colors.primary },
  cardDone: { opacity: 0.55 },
  time: { width: 50 },
  start: { ...typography.body, fontWeight: '800', color: colors.textPrimary },
  end: { ...typography.caption, color: colors.textSecondary },
  bar: { width: 4, alignSelf: 'stretch', borderRadius: 2, marginHorizontal: spacing.sm + 2 },
  body: { flex: 1 },
  subject: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  breakText: { color: colors.textSecondary, fontStyle: 'italic', fontWeight: '600' },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  period: { ...typography.overline, color: colors.primary, marginLeft: spacing.sm },
});
