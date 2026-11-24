import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MoreStackParamList } from '../../../navigation/types';
import { useModuleLayout } from '../../../navigation/moduleRegistry';
import { useParent } from '../../../store/ParentContext';
import { useAuth } from '../../../store/AuthContext';
import { colors, moduleColors, radius, shadow, spacing, typography } from '../../../constants/theme';
import { Avatar } from '../../../components/Avatar';
import { childClassLabel, childName } from '../../parent/services/parentService';

type Props = NativeStackScreenProps<MoreStackParamList, 'MoreMenu'>;

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  screen: Exclude<keyof MoreStackParamList, 'MoreMenu'>;
}

export function MoreMenuScreen({ navigation }: Props) {
  const { more } = useModuleLayout();
  const { isParent, activeChild, children, openSwitcher } = useParent();
  const { logout } = useAuth();

  const toItem = (m: (typeof more)[number]): MenuItem => ({ key: m.key, label: m.label, icon: m.icon, screen: m.screen });
  const moduleItems = more.filter((m) => m.section !== 'parent').map(toItem);
  const parentItems = more.filter((m) => m.section === 'parent').map(toItem);
  // Core screens — always present, never hideable by Super Admin
  const accountItems: MenuItem[] = [
    { key: 'notifications', label: 'Notifications', icon: 'notifications', screen: 'Notifications' },
    { key: 'profile', label: isParent ? 'My Account' : 'My Profile', icon: 'person', screen: 'Profile' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isParent && activeChild ? (
        <TouchableOpacity
          activeOpacity={children.length > 1 ? 0.85 : 1}
          onPress={children.length > 1 ? openSwitcher : undefined}
          style={styles.childBanner}
        >
          <Avatar name={childName(activeChild)} size={46} ring />
          <View style={styles.flex}>
            <Text style={styles.bannerOverline}>VIEWING</Text>
            <Text style={styles.bannerName}>{childName(activeChild)}</Text>
            <Text style={styles.bannerMeta}>{childClassLabel(activeChild)}</Text>
          </View>
          {children.length > 1 ? (
            <View style={styles.bannerSwitch}>
              <Icon name="swap-horiz" size={18} color={colors.parent} />
            </View>
          ) : null}
        </TouchableOpacity>
      ) : null}

      {parentItems.length > 0 && <MenuSection title="Parent Corner" items={parentItems} onPress={(s) => navigation.navigate(s)} />}
      {moduleItems.length > 0 && <MenuSection title="Modules" items={moduleItems} onPress={(s) => navigation.navigate(s)} />}
      <MenuSection title="Account" items={accountItems} onPress={(s) => navigation.navigate(s)} />

      <TouchableOpacity style={styles.logout} onPress={logout} accessibilityRole="button">
        <Icon name="logout" size={20} color={colors.danger} />
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MenuSection({ title, items, onPress }: { title: string; items: MenuItem[]; onPress: (s: MenuItem['screen']) => void }) {
  return (
    <>
      <Text style={styles.section}>{title}</Text>
      <View style={styles.group}>
        {items.map((item, i) => {
          const tint = moduleColors[item.key] ?? moduleColors.profile;
          return (
            <TouchableOpacity
              key={item.screen}
              onPress={() => onPress(item.screen)}
              style={[styles.row, i > 0 && styles.divider]}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={[styles.iconChip, { backgroundColor: tint.soft }]}>
                <Icon name={item.icon} size={20} color={tint.solid} />
              </View>
              <Text style={styles.label}>{item.label}</Text>
              <Icon name="chevron-right" size={22} color={colors.disabled} />
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  flex: { flex: 1, marginLeft: spacing.md },
  childBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.parent,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow(2),
  },
  bannerOverline: { ...typography.overline, color: colors.textOnDarkMuted },
  bannerName: { ...typography.h3, color: '#fff' },
  bannerMeta: { ...typography.caption, color: colors.textOnDarkMuted },
  bannerSwitch: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  section: { ...typography.overline, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm, marginLeft: spacing.xs },
  group: { backgroundColor: colors.surface, borderRadius: radius.xl, paddingHorizontal: spacing.md, ...shadow(1) },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 4 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  iconChip: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  label: { ...typography.body, fontWeight: '600', color: colors.textPrimary, flex: 1, marginLeft: spacing.md },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerLight,
  },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15, marginLeft: spacing.sm },
});
