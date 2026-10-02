import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import {
  ClassAssignment,
  RosterStudent,
  fetchMyClasses,
  fetchRoster,
  markAttendance,
} from '../services/attendanceService';

const TODAY = new Date().toISOString().slice(0, 10);

// Local marking state layered on top of the roster — every student starts PRESENT
// (the common case) and the teacher taps to flip absentees, exactly like the
// paper-register workflow it replaces. Deliberately not named `status`, since the
// API's own `status` field on a roster row means something else entirely (see
// attendanceService.ts).
interface RosterDraftItem extends RosterStudent {
  attendanceStatus: 'PRESENT' | 'ABSENT';
}

export function AttendanceScreen() {
  const [selectedClass, setSelectedClass] = useState<ClassAssignment | null>(null);
  const [roster, setRoster] = useState<RosterDraftItem[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const classesQuery = useQuery({ queryKey: ['attendance', 'myClasses'], queryFn: fetchMyClasses });

  const openClass = async (item: ClassAssignment) => {
    setSelectedClass(item);
    setLoadingRoster(true);
    try {
      const students = await fetchRoster(item.sectionId);
      setRoster(students.map((s) => ({ ...s, attendanceStatus: 'PRESENT' })));
    } catch {
      Alert.alert('Error', 'Could not load the class roster.');
      setSelectedClass(null);
    } finally {
      setLoadingRoster(false);
    }
  };

  const toggleStatus = (studentId: string) => {
    setRoster((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, attendanceStatus: s.attendanceStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT' }
          : s,
      ),
    );
  };

  const submit = async () => {
    if (!selectedClass) return;
    setSubmitting(true);
    try {
      await markAttendance({
        sectionId: selectedClass.sectionId,
        subjectId: selectedClass.subjectId,
        date: TODAY,
        records: roster.map((s) => ({ studentId: s.id, status: s.attendanceStatus })),
      });
      Alert.alert('Saved', 'Attendance submitted successfully.');
      setSelectedClass(null);
      setRoster([]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'The backend rejected this submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (selectedClass) {
    return (
      <View style={styles.container}>
        <View style={styles.rosterHeader}>
          <Text style={styles.title}>
            {selectedClass.section.semester.course.name} · {selectedClass.section.name} · {selectedClass.subject.name}
          </Text>
          <Text style={styles.link} onPress={() => setSelectedClass(null)}>
            ← Back
          </Text>
        </View>
        {loadingRoster ? (
          <LoadingView />
        ) : (
          <>
            <FlatList
              contentContainerStyle={styles.content}
              data={roster}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => toggleStatus(item.id)}>
                  <Card style={styles.studentRow}>
                    <Text style={styles.studentName}>{item.rollNumber} · {item.firstName} {item.lastName}</Text>
                    <Text style={[styles.statusBadge, item.attendanceStatus === 'ABSENT' && styles.absentBadge]}>
                      {item.attendanceStatus}
                    </Text>
                  </Card>
                </TouchableOpacity>
              )}
            />
            <Button label="Submit Attendance" onPress={submit} loading={submitting} style={styles.submit} />
          </>
        )}
      </View>
    );
  }

  if (classesQuery.isLoading) return <LoadingView />;
  if (classesQuery.isError) return <ErrorView onRetry={classesQuery.refetch} />;
  if (!classesQuery.data?.length) return <EmptyView title="No classes assigned to you" />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={classesQuery.data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => openClass(item)}>
          <Card style={styles.card}>
            <Text style={styles.title}>
              {item.section.semester.course.name} · {item.section.name}
            </Text>
            <Text style={styles.meta}>{item.subject.name}</Text>
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
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  rosterHeader: { padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: colors.primary, ...typography.body },
  studentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  studentName: { ...typography.body, color: colors.textPrimary },
  statusBadge: { ...typography.caption, color: colors.success, fontWeight: '700' },
  absentBadge: { color: colors.danger },
  submit: { margin: spacing.md },
});
