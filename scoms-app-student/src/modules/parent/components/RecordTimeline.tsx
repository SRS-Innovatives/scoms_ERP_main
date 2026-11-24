import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { useParent } from '../../../store/ParentContext';

export interface Badge {
  text: string;
  color: string;
  bg: string;
  icon?: string;
}

export interface TimelineItem {
  id: string;
  date: string; // ISO
  title: string;
  badges?: Badge[];
  lines?: { label: string; value: string | null | undefined }[];
  body?: string | null;
  footer?: string | null;
  /** Highlights the timeline dot (e.g. an open incident, a hospital referral) */
  emphasis?: boolean;
}

interface Props {
  tint: { solid: string; soft: string };
  icon: string;
  heading: string;
  stats: { label: string; value: string | number; color?: string }[];
  items: TimelineItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  emptyTitle: string;
  emptyMessage: string;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString(undefined, { day: '2-digit' }),
    month: d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
    full: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
  };
};

/** Shared layout for the parent-corner record screens: coloured summary header, then a
 * dated timeline of cards. */
export function RecordTimeline({ tint, icon, heading, stats, items, isLoading, isError, refreshing, onRefresh, emptyTitle, emptyMessage }: Props) {
  const { activeChild } = useParent();
  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorView onRetry={onRefresh} />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={items ?? []}
      keyExtractor={(i) => i.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tint.solid]} />}
      ListHeaderComponent={
        <View style={[styles.summary, { backgroundColor: tint.solid }]}>
          <View style={styles.blob} />
          <View style={styles.summaryTop}>
            <View style={styles.summaryIcon}>
              <Icon name={icon} size={24} color={tint.solid} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.summaryHeading}>{heading}</Text>
              <Text style={styles.summaryChild}>{activeChild ? `For ${activeChild.firstName}` : ''}</Text>
            </View>
          </View>
          <View style={styles.stats}>
            {stats.map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: tint.soft }]}>
            <Icon name="verified" size={36} color={tint.solid} />
          </View>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyMessage}>{emptyMessage}</Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const d = formatDate(item.date);
        const last = index === (items?.length ?? 0) - 1;
        return (
          <View style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.dateBox, { backgroundColor: tint.soft }]}>
                <Text style={[styles.dateDay, { color: tint.solid }]}>{d.day}</Text>
                <Text style={[styles.dateMonth, { color: tint.solid }]}>{d.month}</Text>
              </View>
              {!last && <View style={[styles.line, { backgroundColor: tint.soft }]} />}
            </View>
            <View style={[styles.card, item.emphasis && { borderLeftColor: tint.solid, borderLeftWidth: 4 }]}>
              <Text style={styles.fullDate}>{d.full}</Text>
              <Text style={styles.title}>{item.title}</Text>
              {item.badges?.length ? (
                <View style={styles.badges}>
                  {item.badges.map((b) => (
                    <View key={b.text} style={[styles.badge, { backgroundColor: b.bg }]}>
                      {b.icon ? <Icon name={b.icon} size={12} color={b.color} /> : null}
                      <Text style={[styles.badgeText, { color: b.color }]}>{b.text}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
              {item.lines
                ?.filter((l) => l.value)
                .map((l) => (
                  <View key={l.label} style={styles.line2}>
                    <Text style={styles.lineLabel}>{l.label}</Text>
                    <Text style={styles.lineValue}>{l.value}</Text>
                  </View>
                ))}
              {item.footer ? (
                <View style={styles.footer}>
                  <Icon name="person-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.footerText}>{item.footer}</Text>
                </View>
              ) : null}
            </View>
          </View>
        );
      }}
    />
  );
}

/** Small helper so screens build badges consistently. */
export const badge = (text: string, color: string, bg: string, icon?: string): Badge => ({ text, color, bg, icon });

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  flex: { flex: 1 },
  summary: { borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.lg, overflow: 'hidden', ...shadow(2) },
  blob: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -70, right: -50, backgroundColor: 'rgba(255,255,255,0.14)' },
  summaryTop: { flexDirection: 'row', alignItems: 'center' },
  summaryIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  summaryHeading: { ...typography.h2, color: '#fff' },
  summaryChild: { ...typography.caption, color: colors.textOnDarkMuted },
  stats: { flexDirection: 'row', marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.lg, paddingVertical: spacing.sm },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...typography.h2, color: '#fff' },
  statLabel: { ...typography.caption, fontSize: 11, color: colors.textOnDarkMuted, fontWeight: '600' },
  row: { flexDirection: 'row' },
  rail: { width: 52, alignItems: 'center' },
  dateBox: { width: 46, borderRadius: radius.md, alignItems: 'center', paddingVertical: 6 },
  dateDay: { fontSize: 18, fontWeight: '800' },
  dateMonth: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  line: { width: 3, flex: 1, borderRadius: 2, marginVertical: 4 },
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginLeft: spacing.sm, marginBottom: spacing.md, ...shadow(1) },
  fullDate: { ...typography.caption, fontSize: 11, color: colors.textSecondary },
  title: { ...typography.h3, color: colors.textPrimary, marginTop: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  badge: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, marginRight: spacing.xs, marginBottom: spacing.xs },
  badgeText: { ...typography.overline, fontSize: 10, marginLeft: 2 },
  body: { ...typography.body, color: colors.textPrimary, marginTop: spacing.sm, lineHeight: 21 },
  line2: { marginTop: spacing.sm },
  lineLabel: { ...typography.overline, fontSize: 10, color: colors.textSecondary },
  lineValue: { ...typography.body, color: colors.textPrimary, marginTop: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm + 2, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  footerText: { ...typography.caption, color: colors.textSecondary, marginLeft: 4 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  emptyIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  emptyMessage: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
});
