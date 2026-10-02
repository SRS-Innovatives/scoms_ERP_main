import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Card } from '../../../components/Card';
import { fetchExamResults, fetchExamSchedule } from '../services/examinationService';

export function ExaminationScreen() {
  const [tab, setTab] = useState<'schedule' | 'results'>('schedule');

  const scheduleQuery = useQuery({ queryKey: ['exams', 'schedule'], queryFn: fetchExamSchedule, enabled: tab === 'schedule' });
  const resultsQuery = useQuery({ queryKey: ['exams', 'results'], queryFn: fetchExamResults, enabled: tab === 'results' });

  const active = tab === 'schedule' ? scheduleQuery : resultsQuery;

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Text style={[styles.tab, tab === 'schedule' && styles.tabActive]} onPress={() => setTab('schedule')}>
          Schedule
        </Text>
        <Text style={[styles.tab, tab === 'results' && styles.tabActive]} onPress={() => setTab('results')}>
          Results
        </Text>
      </View>

      {active.isLoading ? (
        <LoadingView />
      ) : active.isError ? (
        <ErrorView onRetry={active.refetch} />
      ) : !active.data?.length ? (
        <EmptyView title={tab === 'schedule' ? 'No exams scheduled' : 'No results published yet'} />
      ) : tab === 'schedule' ? (
        <FlatList
          contentContainerStyle={styles.content}
          data={scheduleQuery.data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={styles.title}>{item.subject.name} · {item.exam.name}</Text>
              <Text style={styles.meta}>{new Date(item.examDate).toLocaleDateString()}</Text>
            </Card>
          )}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={resultsQuery.data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={styles.title}>{item.examSchedule.subject.name} · {item.examSchedule.exam.name}</Text>
              <Text style={styles.meta}>
                {item.isAbsent ? 'Absent' : `${item.marksObtained} / ${item.examSchedule.maxMarks}`}
                {item.grade ? ` (${item.grade})` : ''}
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
  tabs: { flexDirection: 'row', padding: spacing.md, gap: spacing.lg },
  tab: { ...typography.body, color: colors.textSecondary, paddingBottom: spacing.xs },
  tabActive: { color: colors.primary, fontWeight: '700', borderBottomWidth: 2, borderBottomColor: colors.primary },
  content: { padding: spacing.md },
  card: { marginBottom: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
