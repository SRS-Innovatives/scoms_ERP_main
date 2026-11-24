import React, { useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, moduleColors, radius, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { useParent } from '../../../store/ParentContext';
import { Assignment, fetchAssignments, submitAssignment } from '../services/homeworkService';
import { queryKeys } from '../../../services/api/queryKeys';

const tint = moduleColors.homework;

const dueInfo = (iso: string, submitted: boolean) => {
  const due = new Date(iso);
  const days = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
  const date = due.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  if (submitted) return { text: `Due ${date}`, color: colors.textSecondary };
  if (days < 0) return { text: `Overdue · ${date}`, color: colors.danger };
  if (days === 0) return { text: 'Due today', color: colors.warning };
  if (days === 1) return { text: 'Due tomorrow', color: colors.warning };
  return { text: `Due ${date} · ${days} days left`, color: colors.textSecondary };
};

function SubmitForm({ assignment, onDone, onCancel }: { assignment: Assignment; onDone: () => void; onCancel: () => void }) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await submitAssignment(assignment.id, content.trim());
      onDone();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not submit this homework.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card>
        <Text style={styles.subject}>{assignment.subjectName}</Text>
        <Text style={styles.title}>{assignment.title}</Text>
        {assignment.description ? <Text style={styles.description}>{assignment.description}</Text> : null}
      </Card>
      <View style={styles.formGap} />
      <TextField label="Your answer" value={content} onChangeText={setContent} multiline style={styles.answer} />
      <Button label="Submit Homework" onPress={handleSubmit} loading={submitting} disabled={!content.trim()} color={tint.solid} />
      <Text style={styles.cancel} onPress={onCancel}>
        Cancel
      </Text>
    </ScrollView>
  );
}

export function HomeworkScreen() {
  const queryClient = useQueryClient();
  const { isParent, activeChild } = useParent();
  const [submittingFor, setSubmittingFor] = useState<Assignment | null>(null);
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.homework,
    queryFn: fetchAssignments,
  });

  // Parents can follow homework but never submit it (the backend refuses it too —
  // blockParentWrite on POST /assignments/submit)
  if (submittingFor && !isParent) {
    return (
      <SubmitForm
        assignment={submittingFor}
        onCancel={() => setSubmittingFor(null)}
        onDone={() => {
          setSubmittingFor(null);
          queryClient.invalidateQueries({ queryKey: queryKeys.homework });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardAll }); // pending-homework tile
        }}
      />
    );
  }

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorView onRetry={refetch} />;
  if (!data?.length) return <EmptyView title="No homework assigned" message="New homework from teachers will show up here." />;

  const pending = data.filter((a) => !a.mySubmission).length;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={data}
      keyExtractor={(item: Assignment) => item.id}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} colors={[tint.solid]} />}
      ListHeaderComponent={
        <>
          <View style={[styles.summary, { backgroundColor: tint.soft }]}>
            <Icon name="menu-book" size={26} color={tint.solid} />
            <View style={styles.summaryText}>
              <Text style={styles.summaryValue}>{pending === 0 ? 'All caught up 🎉' : `${pending} pending`}</Text>
              <Text style={styles.summaryMeta}>
                {data.length} assignment{data.length === 1 ? '' : 's'} in total
              </Text>
            </View>
          </View>
          {isParent ? (
            <View style={styles.parentNote}>
              <Icon name="info-outline" size={18} color={colors.parent} />
              <Text style={styles.parentNoteText}>
                You can follow {activeChild?.firstName ?? 'your child'}'s homework here. Only the student can submit it from their own login.
              </Text>
            </View>
          ) : null}
        </>
      }
      renderItem={({ item }) => {
        const submitted = !!item.mySubmission;
        const due = dueInfo(item.dueDate, submitted);
        return (
          <Card style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.subject}>{item.subjectName}</Text>
              <View style={[styles.status, { backgroundColor: submitted ? colors.successLight : colors.warningLight }]}>
                <Text style={[styles.statusText, { color: submitted ? colors.success : colors.warning }]}>
                  {submitted ? item.mySubmission!.status : 'PENDING'}
                </Text>
              </View>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.dueRow}>
              <Icon name="event" size={15} color={due.color} />
              <Text style={[styles.due, { color: due.color }]}>{due.text}</Text>
            </View>
            {submitted && item.mySubmission?.marksObtained != null ? (
              <Text style={styles.marks}>
                Marks: {item.mySubmission.marksObtained} / {item.totalMarks}
              </Text>
            ) : null}
            {!submitted && !isParent && (
              <TouchableOpacity onPress={() => setSubmittingFor(item)} style={[styles.submitBtn, { backgroundColor: tint.solid }]} accessibilityRole="button">
                <Icon name="send" size={16} color="#fff" />
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
            )}
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  summary: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  summaryText: { marginLeft: spacing.md },
  summaryValue: { ...typography.h3, color: colors.textPrimary },
  summaryMeta: { ...typography.caption, color: colors.textSecondary },
  parentNote: {
    flexDirection: 'row',
    backgroundColor: colors.parentLight,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
  },
  parentNoteText: { ...typography.caption, color: colors.parentDark, marginLeft: spacing.sm, flex: 1, lineHeight: 18 },
  card: { marginBottom: spacing.sm + 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subject: { ...typography.overline, color: tint.solid },
  title: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.xs },
  description: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 21 },
  status: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statusText: { ...typography.overline, fontSize: 10 },
  dueRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  due: { ...typography.caption, marginLeft: 4, fontWeight: '600' },
  marks: { ...typography.caption, color: colors.success, fontWeight: '700', marginTop: spacing.xs },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  submitText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  formGap: { height: spacing.md },
  answer: { minHeight: 140, textAlignVertical: 'top', paddingTop: spacing.sm },
  cancel: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, padding: spacing.sm },
});
