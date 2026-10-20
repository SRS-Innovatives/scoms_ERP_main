import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import {
  ExamScheduleSummary,
  MarkRow,
  RosterStudent,
  fetchExamRoster,
  fetchMySchedules,
  saveMarks,
  submitMarks,
} from '../services/examinationService';

interface DraftMark {
  marksObtained: string;
  isAbsent: boolean;
}

function MarksEntryScreen({ schedule, onBack }: { schedule: ExamScheduleSummary; onBack: () => void }) {
  const [roster, setRoster] = useState<RosterStudent[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftMark>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(schedule.markStatus ?? 'DRAFT');
  const queryClient = useQueryClient();

  React.useEffect(() => {
    fetchExamRoster(schedule.id)
      .then((result) => {
        setRoster(result.roster);
        const initial: Record<string, DraftMark> = {};
        result.roster.forEach((s) => {
          initial[s.id] = {
            marksObtained: s.mark && !s.mark.isAbsent ? String(s.mark.marksObtained) : '',
            isAbsent: s.mark?.isAbsent ?? false,
          };
        });
        setDrafts(initial);
      })
      .catch(() => Alert.alert('Error', 'Could not load the marks roster.'))
      .finally(() => setLoading(false));
  }, [schedule.id]);

  const setDraft = (studentId: string, patch: Partial<DraftMark>) => {
    setDrafts((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }));
  };

  const buildRows = (): MarkRow[] =>
    Object.entries(drafts)
      .filter(([, d]) => d.isAbsent || d.marksObtained !== '')
      .map(([studentId, d]) => ({
        studentId,
        isAbsent: d.isAbsent,
        marksObtained: d.isAbsent ? null : Number(d.marksObtained),
      }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveMarks(schedule.id, buildRows());
      Alert.alert('Saved', 'Marks saved. A Principal, Vice Principal, or Exam Admin publishes results once every subject is entered.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not save marks.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await saveMarks(schedule.id, buildRows());
      await submitMarks(schedule.id);
      setStatus('SUBMITTED');
      queryClient.invalidateQueries({ queryKey: ['staff', 'exams', 'mySchedules'] });
      Alert.alert('Submitted', 'Marks submitted for verification.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not submit marks.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingView />;

  return (
    <View style={styles.container}>
      <View style={styles.rosterHeader}>
        <Text style={styles.title}>
          {schedule.subject.name} · {schedule.exam.name}
        </Text>
        <Text style={styles.link} onPress={onBack}>
          ← Back
        </Text>
      </View>
      <Text style={styles.meta}>
        Max marks: {schedule.maxMarks} · Stage: {status}
      </Text>
      {status === 'DRAFT' && schedule.reviewRemarks ? (
        <Text style={styles.meta}>Returned: {schedule.reviewRemarks}</Text>
      ) : null}

      <FlatList
        contentContainerStyle={styles.content}
        data={roster ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const draft = drafts[item.id] ?? { marksObtained: '', isAbsent: false };
          return (
            <Card style={styles.studentCard}>
              <Text style={styles.studentName}>
                {item.rollNumber} · {item.firstName} {item.lastName}
              </Text>
              <View style={styles.markRow}>
                <TextInput
                  style={[styles.marksInput, draft.isAbsent && styles.marksInputDisabled]}
                  keyboardType="numeric"
                  placeholder="Marks"
                  editable={!draft.isAbsent}
                  value={draft.marksObtained}
                  onChangeText={(text) => setDraft(item.id, { marksObtained: text })}
                />
                <TouchableOpacity
                  onPress={() => setDraft(item.id, { isAbsent: !draft.isAbsent, marksObtained: '' })}
                >
                  <Text style={[styles.absentToggle, draft.isAbsent && styles.absentToggleActive]}>
                    Absent
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        }}
      />

      {schedule.isPublished ? (
        <Text style={styles.locked}>Published and locked from further edits.</Text>
      ) : (
        // Publishing is a Principal/Vice Principal/Exam Admin action (RESULTS_PUBLISH),
        // not a Teacher/HOD one — this screen only ever gets MARKS_ENTER, so it only
        // ever offers Save, never Publish (see roleNavigation.ts for why).
        <View style={styles.actions}>
          <Button label="Save Marks" onPress={handleSave} loading={saving} style={styles.actionButton} />
          {status === 'DRAFT' ? (
            <Button label="Submit for Verification" onPress={handleSubmit} loading={submitting} style={styles.actionButton} />
          ) : null}
        </View>
      )}
    </View>
  );
}

export function ExaminationScreen() {
  const [openSchedule, setOpenSchedule] = useState<ExamScheduleSummary | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['staff', 'exams', 'mySchedules'],
    queryFn: fetchMySchedules,
  });

  if (openSchedule) {
    return <MarksEntryScreen schedule={openSchedule} onBack={() => setOpenSchedule(null)} />;
  }

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorView onRetry={refetch} />;
  if (!data?.length) return <EmptyView title="No exam duties assigned" />;

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => setOpenSchedule(item)}>
          <Card style={styles.card}>
            <Text style={styles.title}>
              {item.subject.name} · {item.exam.name}
            </Text>
            <Text style={styles.meta}>{new Date(item.examDate).toLocaleDateString()}</Text>
            <Text style={styles.meta}>
              {item._count.studentMarks} marks entered
              {item.isPublished ? ' · Published' : ` · ${item.markStatus ?? 'DRAFT'}`}
            </Text>
          </Card>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  card: { marginBottom: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, marginLeft: spacing.md },
  rosterHeader: { padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: colors.primary, ...typography.body },
  studentCard: { marginBottom: spacing.sm },
  studentName: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs },
  markRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  marksInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    color: colors.textPrimary,
  },
  marksInputDisabled: { backgroundColor: colors.background, color: colors.disabled },
  absentToggle: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  absentToggleActive: { color: colors.danger },
  actions: { padding: spacing.md },
  actionButton: { marginBottom: spacing.sm },
  locked: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', padding: spacing.md },
});
