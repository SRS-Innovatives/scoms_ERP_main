import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreStackParamList } from '../../../navigation/types';
import { colors, radius, spacing, typography } from '../../../constants/theme';
import { TextField } from '../../../components/TextField';
import { Button } from '../../../components/Button';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { queryKeys } from '../../../services/api/queryKeys';
import {
  fetchParentProfile,
  ParentEditableField,
  PARENT_EDITABLE_FIELDS,
  ParentProfile,
  ParentProfileUpdate,
  updateParentProfile,
} from '../services/parentService';

type Props = NativeStackScreenProps<MoreStackParamList, 'EditParentProfile'>;
type Form = Record<ParentEditableField, string>;

const PHONE_RE = /^\+?[0-9][0-9 -]{6,14}[0-9]$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toForm = (p: ParentProfile): Form =>
  Object.fromEntries(PARENT_EDITABLE_FIELDS.map((f) => [f, p[f] ?? ''])) as Form;

function validate(form: Form): Partial<Record<ParentEditableField, string>> {
  const errors: Partial<Record<ParentEditableField, string>> = {};
  (['fatherPhone', 'motherPhone', 'guardianPhone'] as const).forEach((f) => {
    if (form[f].trim() && !PHONE_RE.test(form[f].trim())) errors[f] = 'Enter a valid phone number';
  });
  (['fatherEmail', 'motherEmail'] as const).forEach((f) => {
    if (form[f].trim() && !EMAIL_RE.test(form[f].trim())) errors[f] = 'Enter a valid email address';
  });
  return errors;
}

/** Parent edits their own contact details. Names and the login ID stay with the school. */
export function EditParentProfileScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: queryKeys.parentProfile, queryFn: fetchParentProfile });
  const [form, setForm] = useState<Form | null>(null);
  const [touched, setTouched] = useState(false);

  const current = useMemo(() => form ?? (profileQuery.data ? toForm(profileQuery.data) : null), [form, profileQuery.data]);
  const errors = current ? validate(current) : {};

  const mutation = useMutation({
    mutationFn: updateParentProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.parentProfile, updated);
      Alert.alert('Saved', 'Your details were updated.');
      navigation.goBack();
    },
    onError: (err: any) => Alert.alert("Couldn't save", err?.response?.data?.message || 'Please try again.'),
  });

  if (profileQuery.isLoading) return <LoadingView />;
  if (profileQuery.isError || !profileQuery.data || !current) return <ErrorView onRetry={profileQuery.refetch} />;

  const original = toForm(profileQuery.data);
  const changes: ParentProfileUpdate = {};
  PARENT_EDITABLE_FIELDS.forEach((f) => {
    if (current[f].trim() !== original[f].trim()) changes[f] = current[f].trim() || null;
  });
  const hasChanges = Object.keys(changes).length > 0;

  const set = (field: ParentEditableField) => (value: string) => {
    setTouched(true);
    setForm({ ...current, [field]: value });
  };
  const field = (f: ParentEditableField, label: string, icon: string, kind?: 'phone' | 'email') => (
    <TextField
      label={label}
      icon={icon}
      value={current[f]}
      onChangeText={set(f)}
      error={touched ? errors[f] : undefined}
      keyboardType={kind === 'phone' ? 'phone-pad' : kind === 'email' ? 'email-address' : 'default'}
      autoCapitalize={kind ? 'none' : 'words'}
      autoCorrect={false}
    />
  );
  const p = profileQuery.data;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.note}>
          <Icon name="lock-outline" size={18} color={colors.parent} />
          <Text style={styles.noteText}>
            Names and your login ID ({p.loginMobile || p.loginEmail || '—'}) are managed by the school office.
          </Text>
        </View>

        <Section title={`Father${p.fatherName ? ` · ${p.fatherName}` : ''}`} icon="man">
          {field('fatherPhone', 'Phone', 'phone', 'phone')}
          {field('fatherEmail', 'Email', 'email', 'email')}
          {field('fatherOccupation', 'Occupation', 'work-outline')}
        </Section>

        <Section title={`Mother${p.motherName ? ` · ${p.motherName}` : ''}`} icon="woman">
          {field('motherPhone', 'Phone', 'phone', 'phone')}
          {field('motherEmail', 'Email', 'email', 'email')}
          {field('motherOccupation', 'Occupation', 'work-outline')}
        </Section>

        <Section title="Guardian (optional)" icon="shield">
          {field('guardianName', 'Name', 'person-outline')}
          {field('guardianRelation', 'Relation to student', 'people-outline')}
          {field('guardianPhone', 'Phone', 'phone', 'phone')}
        </Section>

        <Section title="Address" icon="home">
          <TextField label="Home address" icon="place" value={current.address} onChangeText={set('address')} multiline style={styles.address} />
        </Section>

        <Button
          label="Save changes"
          color={colors.parent}
          onPress={() => {
            setTouched(true);
            if (Object.keys(errors).length === 0 && hasChanges) mutation.mutate(changes);
          }}
          loading={mutation.isPending}
          disabled={!hasChanges}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Icon name={icon} size={18} color={colors.parent} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  note: { flexDirection: 'row', backgroundColor: colors.parentLight, borderRadius: radius.md, padding: spacing.sm + 4, marginBottom: spacing.md },
  noteText: { ...typography.caption, color: colors.parentDark, marginLeft: spacing.sm, flex: 1, lineHeight: 18 },
  section: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, paddingBottom: spacing.xs, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionIcon: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.parentLight, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginLeft: spacing.sm, flex: 1 },
  address: { minHeight: 80, textAlignVertical: 'top' },
});
