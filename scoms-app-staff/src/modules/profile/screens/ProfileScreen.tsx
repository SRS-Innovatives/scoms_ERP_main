import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../../store/AuthContext';
import { colors, radius, ROLE_LABELS, shadow, spacing, typography } from '../../../constants/theme';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';

export function ProfileScreen() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const fullName = [user.staff?.firstName, user.staff?.lastName].filter(Boolean).join(' ').trim();
  const name = fullName || user.staff?.designation || user.email || 'Staff member';

  const confirmLogout = () =>
    Alert.alert('Sign out?', 'You will need to sign in again to use the app.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerBand} />
        <Avatar name={name} size={84} ring style={styles.avatar} />
        <Text style={styles.name}>{name}</Text>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>{(ROLE_LABELS[user.role] ?? user.role).toUpperCase()}</Text>
        </View>
        {user.staff?.designation ? <Text style={styles.designation}>{user.staff.designation}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>WORK</Text>
      <View style={styles.group}>
        <Row icon="badge" label="Employee code" value={user.staff?.employeeCode ?? user.employeeCode ?? '—'} />
        <Row icon="apartment" label="Department" value={user.staff?.department?.name ?? '—'} />
        <Row icon="school" label="Institution" value={user.institution?.name ?? '—'} last />
      </View>

      <Text style={styles.sectionTitle}>CONTACT</Text>
      <View style={styles.group}>
        <Row icon="email" label="Email" value={user.email ?? '—'} />
        <Row icon="phone" label="Mobile" value={user.mobile ?? '—'} last />
      </View>

      <Text style={styles.footNote}>To change these details, contact your institution office.</Text>

      <Button label="Sign out" icon="logout" variant="danger" onPress={confirmLogout} style={styles.logout} />
    </ScrollView>
  );
}

function Row({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <View style={styles.rowIcon}>
        <Icon name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} selectable>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingBottom: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadow(1),
  },
  headerBand: { alignSelf: 'stretch', height: 64, backgroundColor: colors.primary },
  avatar: { marginTop: -42 },
  name: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.md },
  rolePill: { backgroundColor: colors.primarySoft, borderRadius: radius.full, paddingHorizontal: spacing.sm + 4, paddingVertical: 3, marginTop: spacing.sm },
  roleText: { ...typography.overline, color: colors.primaryDark },
  designation: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  sectionTitle: { ...typography.overline, color: colors.textSecondary, marginBottom: spacing.sm, marginLeft: spacing.xs },
  group: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md, marginBottom: spacing.lg, ...shadow(1) },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 4 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowIcon: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, marginLeft: spacing.md },
  label: { ...typography.caption, color: colors.textSecondary },
  value: { ...typography.body, fontWeight: '600', color: colors.textPrimary, marginTop: 1 },
  footNote: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  logout: { marginTop: spacing.xs },
});
