import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { Assignment, MyClass, createAssignment, fetchAssignments, fetchMyClasses } from '../services/homeworkService';

function CreateHomeworkForm({ onDone }: { onDone: () => void }) {
  const [classes, setClasses] = useState<MyClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<MyClass | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyClasses().then((list) => {
      setClasses(list);
      if (list.length) setSelectedClass(list[0]);
    });
  }, []);

  const handleSubmit = async () => {
    if (!selectedClass || !title || !dueDate) return;
    setSubmitting(true);
    try {
      await createAssignment({
        sectionId: selectedClass.sectionId,
        subjectId: selectedClass.subjectId,
        title,
        description: description || undefined,
        dueDate,
        totalMarks: totalMarks ? Number(totalMarks) : undefined,
      });
      onDone();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not publish this homework.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!classes.length) {
    return <EmptyView title="No assigned classes" message="You aren't mapped to teach any subject/section yet." />;
  }

  return (
    <View style={styles.content}>
      <Text style={styles.label}>Class</Text>
      <View style={styles.chipsRow}>
        {classes.map((c) => (
          <TouchableOpacity key={`${c.subjectId}-${c.sectionId}`} onPress={() => setSelectedClass(c)}>
            <Text style={[styles.chip, selectedClass?.sectionId === c.sectionId && selectedClass?.subjectId === c.subjectId && styles.chipActive]}>
              {c.className} · {c.subjectName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Chapter 4 exercises" />
      <TextField label="Description (optional)" value={description} onChangeText={setDescription} multiline />
      <TextField label="Due date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} />
      <TextField label="Total marks (optional)" value={totalMarks} onChangeText={setTotalMarks} keyboardType="numeric" />

      <Button label="Publish Homework" onPress={handleSubmit} loading={submitting} disabled={!selectedClass || !title || !dueDate} />
      <Text style={styles.cancel} onPress={onDone}>Cancel</Text>
    </View>
  );
}

export function HomeworkScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['staff', 'assignments'],
    queryFn: fetchAssignments,
  });

  if (showForm) {
    return (
      <CreateHomeworkForm
        onDone={() => {
          setShowForm(false);
          queryClient.invalidateQueries({ queryKey: ['staff', 'assignments'] });
        }}
      />
    );
  }

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorView onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <Button label="New Homework" onPress={() => setShowForm(true)} style={styles.newButton} />
      {!data?.length ? (
        <EmptyView title="No homework created yet" />
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={data}
          keyExtractor={(item: Assignment) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{item.subjectName} · {item.className}</Text>
              <Text style={styles.meta}>
                Due {new Date(item.dueDate).toLocaleDateString()} · {item._count.submissions} submission(s)
              </Text>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  newButton: { margin: spacing.md },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row' },
  title: { ...typography.h3, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  cancel: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    ...typography.caption,
    color: colors.textSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipActive: { color: '#fff', backgroundColor: colors.primary, borderColor: colors.primary },
});
