import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../../store/AuthContext';
import { colors, spacing, typography } from '../../../constants/theme';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';

export function ProfileScreen() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Row label="Employee Code" value={user.staff?.employeeCode ?? user.employeeCode ?? '—'} />
        <Row label="Designation" value={user.staff?.designation ?? '—'} />
        <Row label="Department" value={user.staff?.department?.name ?? '—'} />
        <Row label="Institution" value={user.institution?.name ?? '—'} />
        <Row label="Email" value={user.email ?? '—'} />
        <Row label="Mobile" value={user.mobile ?? '—'} />
      </Card>

      <Button label="Logout" variant="secondary" onPress={logout} style={styles.logout} />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  label: { ...typography.body, color: colors.textSecondary },
  value: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  logout: { marginTop: spacing.lg },
});
