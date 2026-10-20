import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { EmptyView } from '../../../components/EmptyView';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { JobPosting, closePosting, createPosting, fetchPostings } from '../services/placementService';

function CreatePostingForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !company) return;
    setSubmitting(true);
    try {
      await createPosting({ title, company, location: location || undefined, description: description || undefined });
      onDone();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not publish this posting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.content}>
      <TextField label="Job title" value={title} onChangeText={setTitle} />
      <TextField label="Company" value={company} onChangeText={setCompany} />
      <TextField label="Location (optional)" value={location} onChangeText={setLocation} />
      <TextField label="Description (optional)" value={description} onChangeText={setDescription} multiline />
      <Button label="Publish Posting" onPress={handleSubmit} loading={submitting} disabled={!title || !company} />
      <Text style={styles.cancel} onPress={onDone}>Cancel</Text>
    </View>
  );
}

export function PlacementScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['placement', 'postings'],
    queryFn: fetchPostings,
  });

  const handleClose = async (posting: JobPosting) => {
    try {
      await closePosting(posting.id);
      queryClient.invalidateQueries({ queryKey: ['placement'] });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not close this posting.');
    }
  };

  if (showForm) {
    return (
      <CreatePostingForm
        onDone={() => {
          setShowForm(false);
          queryClient.invalidateQueries({ queryKey: ['placement'] });
        }}
      />
    );
  }

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorView onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <Button label="New Posting" onPress={() => setShowForm(true)} style={styles.newButton} />
      {!data?.length ? (
        <EmptyView title="No postings yet" />
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{item.company} {item.location ? `· ${item.location}` : ''}</Text>
              <Text style={styles.meta}>
                {item.type} · {item._count.applications} application(s) · {item.status}
              </Text>
              {item.status !== 'CLOSED' && (
                <Button label="Close Posting" variant="secondary" onPress={() => handleClose(item)} style={styles.actionButton} />
              )}
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
  actionButton: { marginTop: spacing.sm },
  cancel: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
});
