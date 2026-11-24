import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery } from '@tanstack/react-query';
import { colors, moduleColors, radius, shadow, spacing, typography } from '../../../constants/theme';
import { ErrorView } from '../../../components/ErrorView';
import { queryKeys } from '../../../services/api/queryKeys';
import { CalendarEvent, CalendarEventType, fetchCalendarEvents } from '../services/calendarService';

const tint = moduleColors.academic_calendar;

const TYPE: Record<CalendarEventType, { label: string; color: string; bg: string; icon: string }> = {
  HOLIDAY: { label: 'Holiday', color: '#DC2626', bg: '#FEE2E2', icon: 'beach-access' },
  EXAM: { label: 'Exam', color: '#7C3AED', bg: '#EDE9FE', icon: 'edit-note' },
  EVENT: { label: 'Event', color: '#2563EB', bg: '#DBEAFE', icon: 'celebration' },
  DEADLINE: { label: 'Deadline', color: '#D97706', bg: '#FEF3C7', icon: 'alarm' },
  OTHER: { label: 'Other', color: '#475569', bg: '#F1F5F9', icon: 'event' },
};
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** Server dates are @db.Date (midnight UTC) — read just the calendar part. */
const dayOf = (iso: string) => iso.slice(0, 10);

/** Every YYYY-MM-DD an event covers within the month. */
const coveredDays = (e: CalendarEvent, monthStart: string, monthEnd: string) => {
  const out: string[] = [];
  const start = dayOf(e.startDate);
  const end = e.endDate ? dayOf(e.endDate) : start;
  const cur = new Date(`${start < monthStart ? monthStart : start}T00:00:00`);
  const last = end > monthEnd ? monthEnd : end;
  while (ymd(cur) <= last) {
    out.push(ymd(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
};

export function AcademicCalendarScreen() {
  const now = new Date();
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(null);

  const first = month;
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const from = ymd(first);
  const to = ymd(last);

  // One request per month viewed; cached, so flipping back is instant
  const q = useQuery({
    queryKey: [...queryKeys.academicCalendar, from],
    queryFn: () => fetchCalendarEvents(from, to),
    staleTime: 10 * 60_000,
    placeholderData: (prev) => prev, // keep the old month visible while the next one loads
  });

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    (q.data ?? []).forEach((e) => coveredDays(e, from, to).forEach((d) => map.set(d, [...(map.get(d) ?? []), e])));
    return map;
  }, [q.data, from, to]);

  const cells: (Date | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: last.getDate() }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];
  const today = ymd(now);
  const list = selected ? byDay.get(selected) ?? [] : q.data ?? [];

  const shift = (n: number) => {
    setSelected(null);
    setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  };

  if (q.isError && !q.data) return <ErrorView onRetry={q.refetch} />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => { q.refetch(); }} colors={[tint.solid]} />}
    >
      <View style={styles.calendar}>
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={() => shift(-1)} style={styles.navBtn} accessibilityLabel="Previous month">
            <Icon name="chevron-left" size={26} color={tint.solid} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
          <TouchableOpacity onPress={() => shift(1)} style={styles.navBtn} accessibilityLabel="Next month">
            <Icon name="chevron-right" size={26} color={tint.solid} />
          </TouchableOpacity>
        </View>

        <View style={styles.week}>
          {WEEKDAYS.map((d, i) => (
            <Text key={`${d}${i}`} style={[styles.weekday, (i === 0 || i === 6) && styles.weekend]}>
              {d}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((d, i) => {
            if (!d) return <View key={`e${i}`} style={styles.cell} />;
            const key = ymd(d);
            const events = byDay.get(key) ?? [];
            const isToday = key === today;
            const isSel = key === selected;
            const holiday = events.some((e) => e.eventType === 'HOLIDAY');
            return (
              <TouchableOpacity
                key={key}
                style={styles.cell}
                onPress={() => setSelected(isSel ? null : key)}
                accessibilityLabel={`${d.toDateString()}${events.length ? `, ${events.length} events` : ''}`}
              >
                <View style={[styles.day, isToday && [styles.dayToday, { borderColor: tint.solid }], isSel && { backgroundColor: tint.solid }]}>
                  <Text style={[styles.dayText, holiday && { color: TYPE.HOLIDAY.color }, isSel && styles.dayTextSel]}>{d.getDate()}</Text>
                </View>
                <View style={styles.dots}>
                  {[...new Set(events.map((e) => e.eventType))].slice(0, 3).map((t) => (
                    <View key={t} style={[styles.dot, { backgroundColor: TYPE[t]?.color ?? TYPE.OTHER.color }]} />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.legend}>
          {(Object.keys(TYPE) as CalendarEventType[]).slice(0, 4).map((t) => (
            <View key={t} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: TYPE[t].color }]} />
              <Text style={styles.legendText}>{TYPE[t].label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {selected ? new Date(`${selected}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) : 'This month'}
        </Text>
        {selected ? (
          <Text style={[styles.clear, { color: tint.solid }]} onPress={() => setSelected(null)}>
            Show all
          </Text>
        ) : null}
      </View>

      {q.isLoading ? (
        <Text style={styles.emptyText}>Loading…</Text>
      ) : list.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="event-busy" size={34} color={colors.disabled} />
          <Text style={styles.emptyText}>{selected ? 'Nothing on this day' : 'No events this month'}</Text>
        </View>
      ) : (
        list.map((e) => {
          const t = TYPE[e.eventType] ?? TYPE.OTHER;
          const start = new Date(`${dayOf(e.startDate)}T00:00:00`);
          const end = e.endDate ? new Date(`${dayOf(e.endDate)}T00:00:00`) : null;
          const multi = end && dayOf(e.endDate!) !== dayOf(e.startDate);
          return (
            <View key={e.id} style={styles.event}>
              <View style={[styles.eventDate, { backgroundColor: t.bg }]}>
                <Text style={[styles.eventDay, { color: t.color }]}>{start.getDate()}</Text>
                <Text style={[styles.eventMon, { color: t.color }]}>{start.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.eventTitle}>{e.title}</Text>
                <View style={styles.eventMetaRow}>
                  <View style={[styles.typeBadge, { backgroundColor: t.bg }]}>
                    <Icon name={t.icon} size={12} color={t.color} />
                    <Text style={[styles.typeText, { color: t.color }]}>{t.label.toUpperCase()}</Text>
                  </View>
                  {multi ? (
                    <Text style={styles.eventMeta}>until {end!.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</Text>
                  ) : null}
                </View>
                {e.description ? <Text style={styles.eventDesc}>{e.description}</Text> : null}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  flex: { flex: 1 },
  calendar: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.sm + 4, ...shadow(2) },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  navBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: tint.soft },
  monthTitle: { ...typography.h3, color: colors.textPrimary },
  week: { flexDirection: 'row' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', ...typography.overline, color: colors.textSecondary, paddingVertical: 4 },
  weekend: { color: TYPE.HOLIDAY.color },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayToday: { borderWidth: 2 },
  dayText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  dayTextSel: { color: '#fff', fontWeight: '800' },
  dots: { flexDirection: 'row', height: 6, marginTop: 1 },
  dot: { width: 5, height: 5, borderRadius: 3, marginHorizontal: 1 },
  legend: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.sm },
  legendText: { ...typography.caption, fontSize: 11, color: colors.textSecondary, marginLeft: 4 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.sm },
  listTitle: { ...typography.h3, color: colors.textPrimary },
  clear: { fontWeight: '700' },
  event: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm + 4, marginBottom: spacing.sm, ...shadow(1) },
  eventDate: { width: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, marginRight: spacing.sm + 4 },
  eventDay: { fontSize: 18, fontWeight: '800' },
  eventMon: { fontSize: 10, fontWeight: '800' },
  eventTitle: { ...typography.h3, fontSize: 16, color: colors.textPrimary },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  typeText: { ...typography.overline, fontSize: 9, marginLeft: 3 },
  eventMeta: { ...typography.caption, color: colors.textSecondary, marginLeft: spacing.sm },
  eventDesc: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 18 },
  empty: { alignItems: 'center', paddingVertical: spacing.lg },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
});
