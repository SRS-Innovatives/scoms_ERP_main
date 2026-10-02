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
import {
  HostelBed,
  HostelStudent,
  allocateBed,
  fetchBeds,
  searchStudents,
  vacateBed,
} from '../services/hostelService';

function AllocateBedForm({ bed, onDone }: { bed: HostelBed; onDone: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HostelStudent[]>([]);
  const [selected, setSelected] = useState<HostelStudent | null>(null);
  const [allocating, setAllocating] = useState(false);

  const runSearch = async (q: string) => {
    setQuery(q);
    setSelected(null);
    if (q.length < 2) return setResults([]);
    setResults(await searchStudents(q).catch(() => []));
  };

  const handleAllocate = async () => {
    if (!selected) return;
    setAllocating(true);
    try {
      await allocateBed(bed.id, selected.id);
      Alert.alert('Allocated', `${selected.firstName} ${selected.lastName} assigned to Room ${bed.roomNumber} / Bed ${bed.bedNumber}`);
      onDone();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not allocate this bed.');
    } finally {
      setAllocating(false);
    }
  };

  return (
    <View style={styles.content}>
      <Text style={styles.title}>Room {bed.roomNumber} / Bed {bed.bedNumber}</Text>
      <TextField
        label="Search student by name/roll no."
        value={selected ? `${selected.firstName} ${selected.lastName}` : query}
        onChangeText={runSearch}
      />
      {!selected && results.map((s) => (
        <TouchableOpacity key={s.id} onPress={() => { setSelected(s); setResults([]); }}>
          <Card style={styles.resultCard}>
            <Text style={styles.title}>{s.firstName} {s.lastName}</Text>
            <Text style={styles.meta}>Roll {s.rollNumber}</Text>
          </Card>
        </TouchableOpacity>
      ))}
      <Button label="Allocate Bed" onPress={handleAllocate} loading={allocating} disabled={!selected} />
      <Text style={styles.cancel} onPress={onDone}>Cancel</Text>
    </View>
  );
}

export function HostelScreen() {
  const queryClient = useQueryClient();
  const [allocatingBed, setAllocatingBed] = useState<HostelBed | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['hostel', 'beds'],
    queryFn: fetchBeds,
  });

  const handleVacate = async (bed: HostelBed) => {
    try {
      await vacateBed(bed.id);
      queryClient.invalidateQueries({ queryKey: ['hostel'] });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not vacate this bed.');
    }
  };

  if (allocatingBed) {
    return (
      <AllocateBedForm
        bed={allocatingBed}
        onDone={() => {
          setAllocatingBed(null);
          queryClient.invalidateQueries({ queryKey: ['hostel'] });
        }}
      />
    );
  }

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorView onRetry={refetch} />;
  if (!data?.length) return <EmptyView title="No beds registered" />;

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Text style={styles.title}>{item.hostel.name} · Room {item.roomNumber} / Bed {item.bedNumber}</Text>
          {item.isOccupied && item.student ? (
            <>
              <Text style={styles.meta}>
                {item.student.firstName} {item.student.lastName} · Roll {item.student.rollNumber}
              </Text>
              <Button label="Vacate Bed" variant="secondary" onPress={() => handleVacate(item)} style={styles.actionButton} />
            </>
          ) : (
            <>
              <Text style={[styles.meta, { color: colors.success }]}>Vacant</Text>
              <Button label="Allocate Bed" onPress={() => setAllocatingBed(item)} style={styles.actionButton} />
            </>
          )}
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, backgroundColor: colors.background },
  card: { marginBottom: spacing.sm },
  resultCard: { marginBottom: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  actionButton: { marginTop: spacing.sm },
  cancel: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
});
