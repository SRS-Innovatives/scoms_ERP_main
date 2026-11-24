import React, { useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, moduleColor, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { queryKeys } from '../../../services/api/queryKeys';
import { ClassAssignment, RosterStudent, fetchMyClasses, fetchRoster, markAttendance } from '../services/attendanceService';

type Mark = 'PRESENT' | 'ABSENT' | 'ON_DUTY';

// Local marking state layered on top of the roster — every student starts PRESENT (the
// common case) and the teacher taps A / OD for the exceptions, like the paper register.
// Deliberately not named `status`: the API's own `status` on a roster row is the student's
// enrolment status (see attendanceService.ts).
interface RosterDraftItem extends RosterStudent {
  attendanceStatus: Mark;
}

const MARKS: { key: Mark; short: string; color: string; soft: string }[] = [
  { key: 'PRESENT', short: 'P', color: colors.success, soft: colors.successLight },
  { key: 'ABSENT', short: 'A', color: colors.danger, soft: colors.dangerLight },
  { key: 'ON_DUTY', short: 'OD', color: colors.info, soft: colors.infoLight },
];

const markText = StyleSheet.create({
  PRESENT: { color: colors.success },
  ABSENT: { color: colors.danger },
  ON_DUTY: { color: colors.info },
});

/** Today in the device's local time zone (YYYY-MM-DD) — computed when saving, so a screen
 * left open past midnight never submits for yesterday (toISOString() would also be UTC). */
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const classTitle = (c: ClassAssignment) => `${c.section.semester.course.name} · ${c.section.name}`;

export function AttendanceScreen() {
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<ClassAssignment | null>(null);
  const [roster, setRoster] = useState<RosterDraftItem[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const classesQuery = useQuery({ queryKey: ['attendance', 'myClasses'], queryFn: fetchMyClasses });

  const closeClass = () => {
    setSelectedClass(null);
    setRoster([]);
    setSearch('');
  };

  // Android back while marking → back to the class list, not out of the tab
  useEffect(() => {
    if (!selectedClass) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmLeave();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, roster]);

  const changedFromDefault = roster.some((s) => s.attendanceStatus !== 'PRESENT');
  const confirmLeave = () => {
    if (!changedFromDefault) return closeClass();
    Alert.alert('Discard marking?', "This class's attendance hasn't been submitted yet.", [
      { text: 'Keep marking', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: closeClass },
    ]);
  };

  const openClass = async (item: ClassAssignment) => {
    setSelectedClass(item);
    setLoadingRoster(true);
    try {
      const students = await fetchRoster(item.sectionId, item.subjectId);
      setRoster(students.map((s) => ({ ...s, attendanceStatus: 'PRESENT' })));
    } catch {
      Alert.alert('Error', 'Could not load the class roster.');
      setSelectedClass(null);
    } finally {
      setLoadingRoster(false);
    }
  };

  const setMark = (studentId: string, mark: Mark) =>
    setRoster((prev) => prev.map((s) => (s.id === studentId ? { ...s, attendanceStatus: mark } : s)));
  const setAll = (mark: Mark) => setRoster((prev) => prev.map((s) => ({ ...s, attendanceStatus: mark })));

  const counts = useMemo(() => {
    const c: Record<Mark, number> = { PRESENT: 0, ABSENT: 0, ON_DUTY: 0 };
    roster.forEach((s) => {
      c[s.attendanceStatus] += 1;
    });
    return c;
  }, [roster]);

  const visibleRoster = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter((s) => `${s.firstName} ${s.lastName} ${s.rollNumber} ${s.admissionNumber}`.toLowerCase().includes(q));
  }, [roster, search]);

  const doSubmit = async () => {
    if (!selectedClass) return;
    setSubmitting(true);
    try {
      await markAttendance({
        sectionId: selectedClass.sectionId,
        subjectId: selectedClass.subjectId,
        date: localToday(),
        records: roster.map((s) => ({ studentId: s.id, status: s.attendanceStatus })),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardAll });
      Alert.alert('Attendance saved', `${classTitle(selectedClass)} — ${counts.PRESENT} present, ${counts.ABSENT} absent${counts.ON_DUTY ? `, ${counts.ON_DUTY} on duty` : ''}.`);
      closeClass();
    } catch (err: any) {
      Alert.alert('Not saved', err?.response?.data?.message || 'The server rejected this submission. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const submit = () =>
    Alert.alert('Submit attendance?', `${counts.PRESENT} present · ${counts.ABSENT} absent${counts.ON_DUTY ? ` · ${counts.ON_DUTY} on duty` : ''}`, [
      { text: 'Review', style: 'cancel' },
      { text: 'Submit', onPress: doSubmit },
    ]);

  // ---------------------------------------------------------------- marking
  if (selectedClass) {
    const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    return (
      <View style={styles.container}>
        <View style={styles.markHeader}>
          <TouchableOpacity onPress={confirmLeave} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back to classes" hitSlop={8}>
            <Icon name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.flex}>
            <Text style={styles.markTitle} numberOfLines={1}>{classTitle(selectedClass)}</Text>
            <Text style={styles.markMeta} numberOfLines={1}>{selectedClass.subject.name} · {dateLabel}</Text>
          </View>
        </View>

        {loadingRoster ? (
          <LoadingView />
        ) : roster.length === 0 ? (
          <EmptyView icon="groups" title="No students in this class" message="Students appear here once they're added to the section." />
        ) : (
          <>
            <View style={styles.summary}>
              <View style={styles.countRow}>
                {MARKS.map((m) => (
                  <View key={m.key} style={[styles.countBox, { backgroundColor: m.soft }]}>
                    <Text style={[styles.countValue, { color: m.color }]}>{counts[m.key]}</Text>
                    <Text style={[styles.countLabel, { color: m.color }]}>{m.key === 'ON_DUTY' ? 'On duty' : m.key === 'PRESENT' ? 'Present' : 'Absent'}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.toolsRow}>
                <View style={styles.search}>
                  <Icon name="search" size={18} color={colors.textSecondary} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search name or roll no."
                    placeholderTextColor={colors.textSecondary}
                    style={styles.searchInput}
                  />
                </View>
                <TouchableOpacity onPress={() => setAll('PRESENT')} style={[styles.bulk, { backgroundColor: colors.successLight }]} accessibilityRole="button">
                  <Text style={[styles.bulkText, { color: colors.success }]}>All P</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setAll('ABSENT')} style={[styles.bulk, { backgroundColor: colors.dangerLight }]} accessibilityRole="button">
                  <Text style={[styles.bulkText, { color: colors.danger }]}>All A</Text>
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              contentContainerStyle={styles.list}
              data={visibleRoster}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.noMatch}>No student matches “{search}”.</Text>}
              renderItem={({ item }) => {
                const name = `${item.firstName} ${item.lastName}`.trim();
                const low = item.attendancePercent !== null && item.attendancePercent < 75;
                return (
                  <View style={[styles.studentRow, item.attendanceStatus === 'ABSENT' && styles.studentAbsent]}>
                    <Avatar name={name || item.rollNumber} size={40} />
                    <View style={styles.studentBody}>
                      <Text style={styles.studentName} numberOfLines={1}>{name}</Text>
                      <Text style={styles.studentMeta} numberOfLines={1}>
                        Roll {item.rollNumber}
                        {item.attendancePercent !== null ? (
                          <Text style={low ? styles.lowPct : undefined}>{`  ·  ${Math.round(item.attendancePercent)}%`}</Text>
                        ) : null}
                      </Text>
                    </View>
                    <View style={styles.segment}>
                      {MARKS.map((m) => {
                        const on = item.attendanceStatus === m.key;
                        return (
                          <TouchableOpacity
                            key={m.key}
                            onPress={() => setMark(item.id, m.key)}
                            style={[styles.segBtn, on && { backgroundColor: m.color, borderColor: m.color }]}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: on }}
                            accessibilityLabel={`${name} ${m.key.replace('_', ' ').toLowerCase()}`}
                          >
                            <Text style={[styles.segText, on ? styles.segTextOn : markText[m.key]]}>{m.short}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              }}
            />

            <View style={styles.submitBar}>
              <Button
                label={`Submit · ${counts.PRESENT}/${roster.length} present`}
                icon="check-circle"
                onPress={submit}
                loading={submitting}
              />
            </View>
          </>
        )}
      </View>
    );
  }

  // ---------------------------------------------------------------- class list
  if (classesQuery.isLoading) return <LoadingView />;
  if (classesQuery.isError) return <ErrorView onRetry={classesQuery.refetch} />;
  if (!classesQuery.data?.length) {
    return <EmptyView icon="how-to-reg" title="No classes assigned to you" message="Classes you teach appear here once the timetable office maps them to you." />;
  }

  const accent = moduleColor('attendance');
  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={classesQuery.data}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={<Text style={styles.listHint}>Pick a class to mark today's attendance</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => openClass(item)} style={styles.classCard} accessibilityRole="button" activeOpacity={0.85}>
          <View style={[styles.classIcon, { backgroundColor: accent.soft }]}>
            <Icon name="groups" size={24} color={accent.solid} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.classTitle} numberOfLines={1}>{classTitle(item)}</Text>
            <Text style={styles.classMeta} numberOfLines={1}>
              {item.subject.name} · {item.section._count.students} students
            </Text>
          </View>
          <View style={[styles.markPill, { backgroundColor: accent.solid }]}>
            <Text style={styles.markPillText}>Mark</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  listHint: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow(1),
  },
  classIcon: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  classTitle: { ...typography.h3, color: colors.textPrimary },
  classMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  markPill: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  markPillText: { ...typography.caption, fontWeight: '800', color: '#fff' },

  markHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  markTitle: { ...typography.h3, fontWeight: '700', color: colors.textPrimary },
  markMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  summary: { backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingBottom: spacing.md, ...shadow(1) },
  countRow: { flexDirection: 'row', justifyContent: 'space-between' },
  countBox: { flex: 1, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center', marginHorizontal: 3 },
  countValue: { ...typography.h2 },
  countLabel: { ...typography.caption, fontWeight: '700' },
  toolsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    height: 40,
  },
  searchInput: { flex: 1, marginLeft: spacing.xs, color: colors.textPrimary, paddingVertical: 0, ...typography.body },
  bulk: { marginLeft: spacing.sm, borderRadius: radius.md, paddingHorizontal: spacing.sm + 4, height: 40, justifyContent: 'center' },
  bulkText: { ...typography.caption, fontWeight: '800' },
  noMatch: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    ...shadow(1),
  },
  studentAbsent: { borderLeftColor: colors.danger },
  studentBody: { flex: 1, marginHorizontal: spacing.sm + 2 },
  studentName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  studentMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  lowPct: { color: colors.danger, fontWeight: '700' },
  segment: { flexDirection: 'row' },
  segBtn: {
    minWidth: 38,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
    paddingHorizontal: 4,
  },
  segText: { fontSize: 13, fontWeight: '800' },
  segTextOn: { color: '#fff' },
  submitBar: { padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
