import React from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { VehicleTripRow, fetchTodaysTrips, markTripComplete } from '../services/transportService';

function TripCell({ vehicleId, session, trip }: { vehicleId: string; session: 'MORNING' | 'EVENING'; trip: VehicleTripRow['morning'] }) {
  const queryClient = useQueryClient();
  const complete = trip?.status === 'COMPLETED';

  const handleComplete = async () => {
    try {
      await markTripComplete(vehicleId, session);
      queryClient.invalidateQueries({ queryKey: ['transport', 'trips'] });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not update this trip.');
    }
  };

  return (
    <View style={styles.tripCell}>
      <Text style={styles.tripLabel}>{session === 'MORNING' ? 'Morning' : 'Evening'}</Text>
      {complete ? (
        <Text style={styles.completeBadge}>Completed</Text>
      ) : (
        <Button label="Mark Done" variant="secondary" onPress={handleComplete} style={styles.tripButton} />
      )}
    </View>
  );
}

export function TransportScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['transport', 'trips'],
    queryFn: fetchTodaysTrips,
  });

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorView onRetry={refetch} />;
  if (!data?.length) return <EmptyView title="No vehicles registered" />;

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Text style={styles.title}>{item.vehicleNumber}</Text>
          <Text style={styles.meta}>{item.routeName}</Text>
          <View style={styles.tripsRow}>
            <TripCell vehicleId={item.id} session="MORNING" trip={item.morning} />
            <TripCell vehicleId={item.id} session="EVENING" trip={item.evening} />
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, backgroundColor: colors.background },
  card: { marginBottom: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.sm },
  tripsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  tripCell: { flex: 1, alignItems: 'center' },
  tripLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  tripButton: { height: 36, paddingHorizontal: spacing.md },
  completeBadge: { ...typography.caption, color: colors.success, fontWeight: '700' },
});
