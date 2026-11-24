import React, { useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, moduleColor, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Chip } from '../../../components/Chip';
import { DateStrip } from '../../../components/DateStrip';
import { TextField } from '../../../components/TextField';
import { queryKeys } from '../../../services/api/queryKeys';
import { shortDate, startOfToday, ymd } from '../../../utils/dates';
import { PtmNote, PtmStudent, createPtmNote, fetchPtmNotes, fetchPtmStudents } from '../services/ptmService';

const tint = moduleColor('ptm');
const fullName = (s: { firstName: string; lastName: string }) => `${s.firstName} ${s.lastName}`.trim();

function LogMeetingForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const studentsQuery = useQuery({ queryKey: [...queryKeys.ptm, 'students'], queryFn: fetchPtmStudents, staleTime: 10 * 60_000 });
  const [section, setSection] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [student, setStudent] = useState<PtmStudent | null>(null);
  const [parentName, setParentName] = useState('');
  const [date, setDate] = useState(ymd(startOfToday()));
  const [notes, setNotes] = useState('');

  const sections = useMemo(() => {
    const m = new Map<string, string>();
    (studentsQuery.data ?? []).forEach((s) => s.section && m.set(s.section.id, s.section.name));
    return [...m.entries()];
  }, [studentsQuery.data]);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (studentsQuery.data ?? [])
      .filter((s) => !section || s.section?.id === section)
      .filter((s) => !q || `${fullName(s)} ${s.rollNumber}`.toLowerCase().includes(q))
      .slice(0, 30);
  }, [studentsQuery.data, section, search]);

  const save = useMutation({
    mutationFn: () =>
      createPtmNote({
        studentId: student!.id,
        parentName: parentName.trim() || undefined,
        discussionNotes: notes.trim(),
        meetingDate: date,
      }),
    onSuccess: () => {
      Alert.alert('Meeting notes saved', "The student's parents can now see them in the parent app.");
      onDone();
    },
    onError: (err: any) => Alert.alert('Not saved', err?.response?.data?.message || 'Could not save the notes.'),
  });

  if (studentsQuery.isLoading) return <LoadingView />;
  if (studentsQuery.isError) return <ErrorView onRetry={studentsQuery.refetch} />;
  if (!studentsQuery.data?.length) {
    return (
      <View style={styles.container}>
        <EmptyView icon="groups" title="No students to log for" message="You can log meeting notes for students in classes you teach." />
        <Button label="Back" variant="secondary" onPress={onCancel} style={styles.backBtn} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Student</Text>
        {student ? (
          <View style={styles.pickedRow}>
            <Avatar name={fullName(student)} size={40} />
            <View style={styles.flex}>
              <Text style={styles.name}>{fullName(student)}</Text>
              <Text style={styles.meta}>Roll {student.rollNumber} · {student.section?.name}</Text>
            </View>
            <TouchableOpacity onPress={() => setStudent(null)} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.change}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {sections.length > 1 ? (
              <View style={styles.chipRow}>
                <Chip label="All classes" selected={section === null} onPress={() => setSection(null)} style={styles.chip} />
                {sections.map(([id, name]) => (
                  <Chip key={id} label={name} selected={section === id} onPress={() => setSection(id)} style={styles.chip} />
                ))}
              </View>
            ) : null}
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
            <View style={styles.pickList}>
              {matches.map((s) => (
                <TouchableOpacity key={s.id} onPress={() => setStudent(s)} style={styles.pickItem} accessibilityRole="button">
                  <Avatar name={fullName(s)} size={32} />
                  <Text style={styles.pickName} numberOfLines={1}>{fullName(s)}</Text>
                  <Text style={styles.pickMeta}>{s.rollNumber}</Text>
                </TouchableOpacity>
              ))}
              {matches.length === 0 ? <Text style={styles.noMatch}>No student matches.</Text> : null}
            </View>
          </View>
        )}

        <Text style={[styles.label, styles.gap]}>Meeting date</Text>
        <DateStrip value={date} onChange={setDate} direction="past" daysAhead={60} />

        <View style={styles.gap}>
          <TextField label="Parent / guardian met (optional)" icon="person-outline" value={parentName} onChangeText={setParentName} maxLength={120} />
          <TextField label="What was discussed" icon="forum" value={notes} onChangeText={setNotes} multiline maxLength={4000} placeholder="Progress, concerns, agreed next steps…" />
        </View>
        <Text style={styles.hint}>These notes are shared with the student's parents in the parent app.</Text>

        <Button label="Save notes" icon="save" onPress={() => save.mutate()} loading={save.isPending} disabled={!student || !notes.trim()} color={tint.solid} />
        <Button label="Cancel" variant="secondary" onPress={onCancel} style={styles.gap} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function NoteCard({ note }: { note: PtmNote }) {
  const [open, setOpen] = useState(false);
  const name = note.student ? fullName(note.student) : 'Student';
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Avatar name={name} size={42} />
        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {[note.student?.section?.name, note.parentName ? `with ${note.parentName}` : null].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <View style={[styles.datePill, { backgroundColor: tint.soft }]}>
          <Text style={[styles.dateText, { color: tint.solid }]}>{shortDate(note.meetingDate)}</Text>
        </View>
      </View>
      <Text style={styles.notes} numberOfLines={open ? undefined : 4} onPress={() => setOpen((v) => !v)}>
        {note.discussionNotes}
      </Text>
    </View>
  );
}

/** PTM notes I logged; logging a new one. Parents see them in Parent Corner. */
export function PtmNotesScreen() {
  const queryClient = useQueryClient();
  const [logging, setLogging] = useState(false);
  const query = useQuery({ queryKey: queryKeys.ptm, queryFn: fetchPtmNotes, enabled: !logging });

  if (logging) {
    return (
      <LogMeetingForm
        onCancel={() => setLogging(false)}
        onDone={() => {
          setLogging(false);
          queryClient.invalidateQueries({ queryKey: queryKeys.ptm });
        }}
      />
    );
  }
  if (query.isLoading) return <LoadingView />;
  if (query.isError) return <ErrorView onRetry={query.refetch} />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={query.data ?? []}
      keyExtractor={(n) => n.id}
      refreshing={query.isRefetching}
      onRefresh={query.refetch}
      ListHeaderComponent={<Button label="Log a meeting" icon="add-comment" onPress={() => setLogging(true)} color={tint.solid} style={styles.headerBtn} />}
      ListEmptyComponent={<EmptyView icon="forum" title="No meeting notes yet" message="Notes you log after meeting a parent appear here." />}
      renderItem={({ item }) => <NoteCard note={item} />}
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.xs },
  chip: { marginRight: spacing.sm, marginBottom: spacing.sm, paddingVertical: 6, paddingHorizontal: spacing.md },
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.sm + 2, height: 44, ...shadow(1) },
  searchInput: { flex: 1, marginLeft: spacing.xs, color: colors.textPrimary, paddingVertical: 0, ...typography.body },
  pickList: { backgroundColor: colors.surface, borderRadius: radius.md, marginTop: spacing.sm, maxHeight: 280, overflow: 'hidden', ...shadow(1) },
  pickItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  pickName: { ...typography.body, color: colors.textPrimary, flex: 1, marginLeft: spacing.sm },
  pickMeta: { ...typography.caption, color: colors.textSecondary },
  noMatch: { ...typography.caption, color: colors.textSecondary, padding: spacing.md, textAlign: 'center' },
  pickedRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm + 2, ...shadow(1) },
  change: { ...typography.caption, fontWeight: '700', color: colors.primary },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm + 4, ...shadow(1) },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  name: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  datePill: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  dateText: { ...typography.caption, fontWeight: '800' },
  notes: { ...typography.body, color: colors.textPrimary, marginTop: spacing.sm, lineHeight: 21 },
});
