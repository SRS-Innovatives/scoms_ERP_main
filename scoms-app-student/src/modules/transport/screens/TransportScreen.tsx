import React from 'react';
import { Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery } from '@tanstack/react-query';
import { colors, moduleColors, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { useParent } from '../../../store/ParentContext';
import { queryKeys } from '../../../services/api/queryKeys';
import { MyTransport, fetchMyTransport } from '../services/transportService';

const tint = moduleColors.transport;
const VEHICLE: Record<string, string> = { BUS: 'Bus', VAN: 'Van', MINI_BUS: 'Mini bus' };
const clock = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

function TripPill({ label, icon, trip }: { label: string; icon: string; trip: { status: string; completedAt: string | null } | null }) {
  const done = trip?.status === 'COMPLETED';
  return (
    <View style={[styles.trip, done ? styles.tripDone : styles.tripPending]}>
      <Icon name={icon} size={20} color={done ? colors.success : colors.textSecondary} />
      <View style={styles.tripBody}>
        <Text style={styles.tripLabel}>{label}</Text>
        <Text style={[styles.tripStatus, done && styles.tripStatusDone]}>
          {done ? `Completed${trip?.completedAt ? ` at ${clock(trip.completedAt)}` : ''}` : 'Not completed yet'}
        </Text>
      </View>
      <Icon name={done ? 'check-circle' : 'schedule'} size={20} color={done ? colors.success : colors.disabled} />
    </View>
  );
}

function Assigned({ t }: { t: MyTransport }) {
  const v = t.route.vehicle;
  const call = () => {
    if (!v?.driverPhone) return;
    Linking.openURL(`tel:${v.driverPhone.replace(/[^0-9+]/g, '')}`).catch(() => Alert.alert("Can't call", 'This phone cannot make calls.'));
  };
  return (
    <>
      {/* Route */}
      <View style={[styles.hero, { backgroundColor: tint.solid }]}>
        <Text style={styles.heroLabel}>MY ROUTE</Text>
        <Text style={styles.heroTitle}>{t.route.routeName}</Text>
        <View style={styles.path}>
          <View style={styles.pathCol}>
            <View style={styles.dotStart} />
            <View style={styles.pathLine} />
            <View style={styles.dotEnd} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.stop}>{t.route.startPoint}</Text>
            <Text style={[styles.stop, styles.stopGap]}>{t.route.endPoint}</Text>
          </View>
        </View>
        <View style={styles.pickup}>
          <Icon name="place" size={18} color="#fff" />
          <Text style={styles.pickupText}>Pickup point: {t.pickupPoint}</Text>
        </View>
      </View>

      {/* Today */}
      {t.todayTrips ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          <TripPill label="Morning trip" icon="wb-sunny" trip={t.todayTrips.morning} />
          <TripPill label="Evening trip" icon="nights-stay" trip={t.todayTrips.evening} />
        </View>
      ) : null}

      {/* Bus & driver */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bus & driver</Text>
        {v ? (
          <View style={styles.card}>
            <Row icon="directions-bus" label={VEHICLE[v.vehicleType] ?? v.vehicleType} value={v.vehicleNumber} />
            <Row icon="person" label="Driver" value={v.driverName || '—'} />
            {v.driverPhone ? (
              <TouchableOpacity onPress={call} style={[styles.callBtn, { backgroundColor: tint.solid }]} accessibilityRole="button" accessibilityLabel={`Call driver ${v.driverPhone}`}>
                <Icon name="call" size={18} color="#fff" />
                <Text style={styles.callText}>Call driver · {v.driverPhone}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.muted}>No bus is assigned to this route yet.</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.card}>
          <Row icon="payments" label="Monthly transport fee" value={`₹${Math.round(t.route.monthlyFare).toLocaleString('en-IN')}`} />
        </View>
      </View>
    </>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: tint.soft }]}>
        <Icon name={icon} size={18} color={tint.solid} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

/** The student's (active child's) school transport: route, pickup point, bus, today's trips. */
export function TransportScreen() {
  const { isParent } = useParent();
  const q = useQuery({ queryKey: queryKeys.transport, queryFn: fetchMyTransport });

  if (q.isLoading) return <LoadingView />;
  if (q.isError) return <ErrorView onRetry={q.refetch} />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => { q.refetch(); }} colors={[tint.solid]} />}
    >
      {q.data ? (
        <Assigned t={q.data} />
      ) : (
        <View style={styles.empty}>
          <Icon name="directions-bus" size={48} color={tint.solid} />
          <Text style={styles.emptyTitle}>No transport assigned</Text>
          <Text style={styles.emptyText}>
            {isParent ? 'Your child is' : 'You are'} not on a school bus route. Contact the transport office to opt in.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 },
  flex: { flex: 1 },
  hero: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, ...shadow(2) },
  heroLabel: { ...typography.overline, color: 'rgba(255,255,255,0.8)' },
  heroTitle: { ...typography.h2, color: '#fff', marginTop: 2 },
  path: { flexDirection: 'row', marginTop: spacing.md },
  pathCol: { width: 16, alignItems: 'center', marginRight: spacing.sm, paddingTop: 5 },
  dotStart: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  pathLine: { width: 2, flex: 1, minHeight: 18, backgroundColor: 'rgba(255,255,255,0.5)', marginVertical: 2 },
  dotEnd: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#fff' },
  stop: { ...typography.body, fontWeight: '600', color: '#fff' },
  stopGap: { marginTop: spacing.sm + 4 },
  pickup: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radius.md, padding: spacing.sm },
  pickupText: { ...typography.body, fontWeight: '700', color: '#fff', marginLeft: spacing.xs, flex: 1 },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  trip: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, padding: spacing.sm + 4, marginBottom: spacing.sm, backgroundColor: colors.surface, ...shadow(1) },
  tripDone: { borderLeftWidth: 4, borderLeftColor: colors.success },
  tripPending: { borderLeftWidth: 4, borderLeftColor: colors.border },
  tripBody: { flex: 1, marginHorizontal: spacing.sm },
  tripLabel: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  tripStatus: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  tripStatusDone: { color: colors.success, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow(1) },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs + 2 },
  rowIcon: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { ...typography.body, color: colors.textSecondary, flex: 1, marginLeft: spacing.sm },
  rowValue: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  callBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, paddingVertical: spacing.sm + 2, marginTop: spacing.md },
  callText: { ...typography.body, fontWeight: '700', color: '#fff', marginLeft: spacing.xs },
  muted: { ...typography.body, color: colors.textSecondary },
  empty: { alignItems: 'center', padding: spacing.xl, marginTop: spacing.xl },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
});
