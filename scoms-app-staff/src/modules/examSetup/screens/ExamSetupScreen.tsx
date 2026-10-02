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
import {
  AcademicYear,
  EXAM_TYPES,
  ExamType,
  createExam,
  fetchAcademicYears,
  fetchExams,
} from '../services/examSetupService';

function CreateExamForm({ onDone }: { onDone: () => void }) {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [academicYearId, setAcademicYearId] = useState('');
  const [name, setName] = useState('');
  const [examType, setExamType] = useState<ExamType>('UNIT_TEST');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAcademicYears().then((list) => {
      setYears(list);
      const current = list.find((y) => y.isCurrent) ?? list[0];
      if (current) setAcademicYearId(current.id);
    });
  }, []);

  const handleSubmit = async () => {
    if (!name || !academicYearId || !startDate || !endDate) return;
    setSubmitting(true);
    try {
      await createExam({ name, examType, academicYearId, startDate, endDate });
      onDone();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not create this exam.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.content}>
      <TextField label="Exam name" value={name} onChangeText={setName} placeholder="e.g. Unit Test 1" />

      <Text style={styles.label}>Academic Year</Text>
      <View style={styles.chipsRow}>
        {years.map((y) => (
          <TouchableOpacity key={y.id} onPress={() => setAcademicYearId(y.id)}>
            <Text style={[styles.chip, academicYearId === y.id && styles.chipActive]}>{y.yearName}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Exam Type</Text>
      <View style={styles.chipsRow}>
        {EXAM_TYPES.map((t) => (
          <TouchableOpacity key={t} onPress={() => setExamType(t)}>
            <Text style={[styles.chip, examType === t && styles.chipActive]}>{t.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextField label="Start date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />
      <TextField label="End date (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} />

      <Button
        label="Create Exam"
        onPress={handleSubmit}
        loading={submitting}
        disabled={!name || !academicYearId || !startDate || !endDate}
      />
      <Text style={styles.cancel} onPress={onDone}>Cancel</Text>
    </View>
  );
}

export function ExamSetupScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['examSetup', 'exams'],
    queryFn: fetchExams,
  });

  if (showForm) {
    return (
      <CreateExamForm
        onDone={() => {
          setShowForm(false);
          queryClient.invalidateQueries({ queryKey: ['examSetup'] });
        }}
      />
    );
  }

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorView onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <Button label="New Exam" onPress={() => setShowForm(true)} style={styles.newButton} />
      {!data?.length ? (
        <EmptyView title="No exams set up yet" />
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.meta}>{item.examType} · {item.academicYear?.yearName}</Text>
              <Text style={styles.meta}>
                {new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()}
              </Text>
              <Text style={styles.meta}>{item._count.schedules} subject(s) scheduled · {item.status}</Text>
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
  title: { ...typography.h3, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
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
  cancel: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
});
