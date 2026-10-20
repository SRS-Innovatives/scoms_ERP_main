import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { Assignment, fetchAssignments, submitAssignment } from '../services/homeworkService';

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
    <View style={styles.content}>
      <Text style={styles.title}>{assignment.title}</Text>
      <Text style={styles.meta}>{assignment.subjectName}</Text>
      <TextField label="Your answer" value={content} onChangeText={setContent} multiline />
      <Button label="Submit Homework" onPress={handleSubmit} loading={submitting} disabled={!content.trim()} />
      <Text style={styles.cancel} onPress={onCancel}>Cancel</Text>
    </View>
  );
}

export function HomeworkScreen() {
  const queryClient = useQueryClient();
  const [submittingFor, setSubmittingFor] = useState<Assignment | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['assignments'],
    queryFn: fetchAssignments,
  });

  if (submittingFor) {
    return (
      <SubmitForm
        assignment={submittingFor}
        onCancel={() => setSubmittingFor(null)}
        onDone={() => {
          setSubmittingFor(null);
          queryClient.invalidateQueries({ queryKey: ['assignments'] });
        }}
      />
    );
  }

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorView onRetry={refetch} />;
  if (!data?.length) return <EmptyView title="No homework assigned" />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={data}
      keyExtractor={(item: Assignment) => item.id}
      renderItem={({ item }) => {
        const submitted = !!item.mySubmission;
        return (
          <Card style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={[styles.status, submitted && styles.statusDone]}>
                {submitted ? item.mySubmission!.status : 'Pending'}
              </Text>
            </View>
            <Text style={styles.meta}>{item.subjectName}</Text>
            <Text style={styles.meta}>Due {new Date(item.dueDate).toLocaleDateString()}</Text>
            {!submitted && (
              <TouchableOpacity onPress={() => setSubmittingFor(item)}>
                <Text style={styles.link}>Submit</Text>
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
  content: { padding: spacing.md },
  card: { marginBottom: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h3, color: colors.textPrimary, flex: 1 },
  status: { ...typography.caption, color: colors.warning, fontWeight: '600' },
  statusDone: { color: colors.success },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  link: { color: colors.primary, marginTop: spacing.sm, ...typography.body },
  cancel: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
});
