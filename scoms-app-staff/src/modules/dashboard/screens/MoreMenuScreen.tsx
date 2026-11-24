import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MoreStackParamList } from '../../../navigation/types';
import { colors, moduleColor, radius, ROLE_LABELS, shadow, spacing, typography } from '../../../constants/theme';
import { Avatar } from '../../../components/Avatar';
import { MoreSection, SECTION_TITLES, useModuleLayout } from '../../../navigation/moduleRegistry';
import { useAuth } from '../../../store/AuthContext';

type Props = NativeStackScreenProps<MoreStackParamList, 'MoreMenu'>;

const SECTION_ORDER: MoreSection[] = ['teaching', 'desk', 'communication', 'work'];

function Row({ label, icon, accent, onPress, last }: { label: string; icon: string; accent: { solid: string; soft: string }; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" style={[styles.row, !last && styles.rowDivider]} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: accent.soft }]}>
        <Icon name={icon} size={20} color={accent.solid} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Icon name="chevron-right" size={22} color={colors.disabled} />
    </TouchableOpacity>
  );
}

/** Profile card, every visible module without a bottom tab (moduleRegistry) grouped, then account. */
export function MoreMenuScreen({ navigation }: Props) {
  const { more } = useModuleLayout();
  const { user, logout } = useAuth();
  const fullName = [user?.staff?.firstName, user?.staff?.lastName].filter(Boolean).join(' ').trim();
  const name = fullName || user?.staff?.designation || user?.email || 'My account';

  const confirmLogout = () =>
    Alert.alert('Sign out?', 'You will need to sign in again to use the app.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.profile} onPress={() => navigation.navigate('Profile')} accessibilityRole="button" activeOpacity={0.85}>
        <Avatar name={name} size={56} />
        <View style={styles.profileText}>
          <Text style={styles.profileName} numberOfLines={1}>{name}</Text>
          <Text style={styles.profileMeta} numberOfLines={1}>
            {[user ? ROLE_LABELS[user.role] ?? user.role : null, user?.staff?.employeeCode].filter(Boolean).join(' · ')}
          </Text>
          <Text style={styles.profileLink}>View profile</Text>
        </View>
        <Icon name="chevron-right" size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      {SECTION_ORDER.map((section) => {
        const items = more.filter((m) => m.section === section);
        if (items.length === 0) return null;
        return (
          <View key={section} style={styles.section}>
            <Text style={styles.sectionTitle}>{SECTION_TITLES[section].toUpperCase()}</Text>
            <View style={styles.group}>
              {items.map((m, i) => (
                <Row
                  key={m.screen}
                  label={m.label}
                  icon={m.icon}
                  accent={moduleColor(m.accent)}
                  onPress={() => navigation.navigate(m.screen)}
                  last={i === items.length - 1}
                />
              ))}
            </View>
          </View>
        );
      })}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.group}>
          <Row label="Notifications" icon="notifications" accent={moduleColor('notifications')} onPress={() => navigation.navigate('Notifications')} />
          <Row label="Profile" icon="person" accent={moduleColor('profile')} onPress={() => navigation.navigate('Profile')} last />
        </View>
      </View>

      <TouchableOpacity style={styles.logout} onPress={confirmLogout} accessibilityRole="button">
        <Icon name="logout" size={20} color={colors.danger} />
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadow(1),
  },
  profileText: { flex: 1, marginLeft: spacing.md },
  profileName: { ...typography.h3, fontWeight: '700', color: colors.textPrimary },
  profileMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  profileLink: { ...typography.caption, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.overline, color: colors.textSecondary, marginBottom: spacing.sm, marginLeft: spacing.xs },
  group: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md, ...shadow(1) },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 4 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowIcon: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { ...typography.body, fontWeight: '600', color: colors.textPrimary, flex: 1, marginLeft: spacing.md },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  logoutText: { ...typography.h3, color: colors.danger, marginLeft: spacing.sm },
});
