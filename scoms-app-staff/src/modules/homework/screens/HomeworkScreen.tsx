import React, { useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, moduleColor, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { Chip, statusTone } from '../../../components/Chip';
import { DateStrip } from '../../../components/DateStrip';
import { queryKeys } from '../../../services/api/queryKeys';
import { addDays, daysFromToday, fromYmd, shortDate, startOfToday, ymd } from '../../../utils/dates';
import { Assignment, MyClass, createAssignment, fetchAssignments, fetchMyClasses } from '../services/homeworkService';

const classKey = (c: MyClass) => `${c.subjectId}-${c.sectionId}`;

function CreateHomeworkForm({ classes, onDone, onCancel }: { classes: MyClass[]; onDone: () => void; onCancel: () => void }) {
  const [selected, setSelected] = useState<MyClass>(classes[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(ymd(addDays(startOfToday(), 1)));
  const [totalMarks, setTotalMarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const marksInvalid = totalMarks !== '' && !(Number(totalMarks) > 0);

  const handleSubmit = async () => {
    if (!title.trim() || marksInvalid) return;
    setSubmitting(true);
    try {
      await createAssignment({
        sectionId: selected.sectionId,
        subjectId: selected.subjectId,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        totalMarks: totalMarks ? Number(totalMarks) : undefined,
      });
      Alert.alert('Homework published', `${selected.className} · due ${shortDate(fromYmd(dueDate))}`);
      onDone();
    } catch (err: any) {
      Alert.alert('Not published', err?.response?.data?.message || 'Could not publish this homework.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Class</Text>
        <View style={styles.chipsRow}>
          {classes.map((c) => (
            <Chip
              key={classKey(c)}
              label={`${c.className} · ${c.subjectName}`}
              selected={classKey(selected) === classKey(c)}
              onPress={() => setSelected(c)}
              style={styles.chip}
            />
          ))}
        </View>

        <TextField label="Title" icon="title" value={title} onChangeText={setTitle} placeholder="e.g. Chapter 4 exercises" maxLength={200} />
        <TextField label="Instructions (optional)" icon="notes" value={description} onChangeText={setDescription} multiline />

        <Text style={styles.label}>Due date</Text>
        <DateStrip value={dueDate} onChange={setDueDate} daysAhead={60} />

        <View style={styles.gapTop}>
          <TextField
            label="Total marks (optional)"
            icon="grade"
            value={totalMarks}
            onChangeText={(t) => setTotalMarks(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={4}
            error={marksInvalid ? 'Enter a number above 0' : undefined}
          />
        </View>

        <Button label="Publish homework" icon="send" onPress={handleSubmit} loading={submitting} disabled={!title.trim() || marksInvalid} color={moduleColor('homework').solid} />
        <Button label="Cancel" variant="secondary" onPress={onCancel} style={styles.gapTop} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function dueChip(item: Assignment) {
  const d = daysFromToday(item.dueDate);
  if (d < 0) return { label: 'Closed', tone: 'neutral' as const };
  if (d === 0) return { label: 'Due today', tone: 'danger' as const };
  if (d === 1) return { label: 'Due tomorrow', tone: 'warning' as const };
  return { label: `In ${d} days`, tone: 'info' as const };
}

export function HomeworkScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const listQuery = useQuery({ queryKey: queryKeys.homeworkAll, queryFn: fetchAssignments });
  const classesQuery = useQuery({ queryKey: [...queryKeys.homeworkAll, 'myClasses'], queryFn: fetchMyClasses, staleTime: 10 * 60_000 });

  if (showForm && classesQuery.data?.length) {
    return (
      <CreateHomeworkForm
        classes={classesQuery.data}
        onCancel={() => setShowForm(false)}
        onDone={() => {
          setShowForm(false);
          queryClient.invalidateQueries({ queryKey: queryKeys.homeworkAll });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardAll }); // dashboard: homework numbers
        }}
      />
    );
  }

  if (listQuery.isLoading) return <LoadingView />;
  if (listQuery.isError) return <ErrorView onRetry={listQuery.refetch} />;

  const noClasses = classesQuery.isSuccess && classesQuery.data.length === 0;
  const accent = moduleColor('homework');

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={listQuery.data ?? []}
      keyExtractor={(item) => item.id}
      refreshing={listQuery.isRefetching}
      onRefresh={() => {
        listQuery.refetch();
        classesQuery.refetch();
      }}
      ListHeaderComponent={
        <View style={styles.header}>
          <Button
            label="New homework"
            icon="add-circle-outline"
            onPress={() => setShowForm(true)}
            loading={classesQuery.isLoading}
            disabled={!classesQuery.data?.length}
            color={accent.solid}
          />
          {noClasses ? <Text style={styles.note}>You aren't mapped to teach any class yet, so you can't set homework.</Text> : null}
        </View>
      }
      ListEmptyComponent={<EmptyView icon="menu-book" title="No homework set yet" message="Homework you publish appears here with its submissions." />}
      renderItem={({ item }) => {
        const due = dueChip(item);
        return (
          <View style={styles.card}>
            <View style={[styles.cardIcon, { backgroundColor: accent.soft }]}>
              <Icon name="menu-book" size={22} color={accent.solid} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.cardMeta} numberOfLines={1}>{item.subjectName} · {item.className}</Text>
              <View style={styles.chipLine}>
                <Chip label={due.label} tone={due.tone} style={styles.smallChip} />
                {item.status !== 'PUBLISHED' ? <Chip label={item.status} tone={statusTone(item.status)} style={styles.smallChip} /> : null}
                <View style={styles.subs}>
                  <Icon name="assignment-turned-in" size={15} color={colors.textSecondary} />
                  <Text style={styles.subsText}>{item._count.submissions}</Text>
                </View>
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  list: { padding: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 },
  form: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { marginBottom: spacing.md },
  note: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow(1),
  },
  cardIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  cardTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  cardMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  chipLine: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, flexWrap: 'wrap' },
  smallChip: { marginRight: spacing.xs },
  subs: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
  subsText: { ...typography.caption, fontWeight: '700', color: colors.textSecondary, marginLeft: 3 },
  label: { ...typography.caption, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  gapTop: { marginTop: spacing.md },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  chip: { marginRight: spacing.sm, marginBottom: spacing.sm, paddingVertical: 7, paddingHorizontal: spacing.md },
});
