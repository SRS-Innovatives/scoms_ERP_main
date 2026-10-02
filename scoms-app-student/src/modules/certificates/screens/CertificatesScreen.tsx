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
  CERTIFICATE_TYPES,
  CertificateType,
  fetchCertificateRequests,
  fetchMyCertificates,
  requestCertificate,
} from '../services/certificatesService';

type Tab = 'issued' | 'requests';

function RequestForm({ onDone }: { onDone: () => void }) {
  const [type, setType] = useState<CertificateType>(CERTIFICATE_TYPES[0]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await requestCertificate(type, reason || undefined);
      Alert.alert('Submitted', 'Your certificate request has been sent to the admin office.');
      onDone();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not submit this request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.content}>
      <Text style={styles.label}>Certificate Type</Text>
      <View style={styles.chipsRow}>
        {CERTIFICATE_TYPES.map((t) => (
          <TouchableOpacity key={t} onPress={() => setType(t)}>
            <Text style={[styles.chip, type === t && styles.chipActive]}>{t.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextField label="Reason (optional)" value={reason} onChangeText={setReason} multiline />
      <Button label="Submit Request" onPress={handleSubmit} loading={submitting} />
      <Text style={styles.cancel} onPress={onDone}>Cancel</Text>
    </View>
  );
}

export function CertificatesScreen() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('issued');
  const [showForm, setShowForm] = useState(false);

  const issuedQuery = useQuery({ queryKey: ['certificates', 'issued'], queryFn: fetchMyCertificates, enabled: tab === 'issued' });
  const requestsQuery = useQuery({ queryKey: ['certificates', 'requests'], queryFn: fetchCertificateRequests, enabled: tab === 'requests' });

  if (showForm) {
    return (
      <RequestForm
        onDone={() => {
          setShowForm(false);
          setTab('requests');
          queryClient.invalidateQueries({ queryKey: ['certificates'] });
        }}
      />
    );
  }

  const active = tab === 'issued' ? issuedQuery : requestsQuery;

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Text style={[styles.tab, tab === 'issued' && styles.tabActive]} onPress={() => setTab('issued')}>Issued</Text>
        <Text style={[styles.tab, tab === 'requests' && styles.tabActive]} onPress={() => setTab('requests')}>Requests</Text>
      </View>

      <Button label="Request a Certificate" onPress={() => setShowForm(true)} style={styles.requestButton} />

      {active.isLoading ? (
        <LoadingView />
      ) : active.isError ? (
        <ErrorView onRetry={active.refetch} />
      ) : tab === 'issued' ? (
        !issuedQuery.data?.length ? (
          <EmptyView title="No certificates issued yet" />
        ) : (
          <FlatList
            contentContainerStyle={styles.content}
            data={issuedQuery.data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>{item.certificateNo} · {new Date(item.createdAt).toLocaleDateString()}</Text>
              </Card>
            )}
          />
        )
      ) : !requestsQuery.data?.length ? (
        <EmptyView title="No certificate requests yet" />
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={requestsQuery.data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={styles.title}>{item.type.replace('_', ' ')}</Text>
              <Text style={[styles.meta, styles.status]}>{item.status}</Text>
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
  tabs: { flexDirection: 'row', padding: spacing.md, gap: spacing.lg },
  tab: { ...typography.body, color: colors.textSecondary, paddingBottom: spacing.xs },
  tabActive: { color: colors.primary, fontWeight: '700', borderBottomWidth: 2, borderBottomColor: colors.primary },
  requestButton: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  card: { marginBottom: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  status: { fontWeight: '700', color: colors.warning },
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
