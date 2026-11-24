import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../../store/AuthContext';
import { useParent } from '../../../store/ParentContext';
import { colors, radius, shadow, spacing, typography } from '../../../constants/theme';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MoreStackParamList } from '../../../navigation/types';
import { childClassLabel, childName, fetchParentProfile, parentDisplayName } from '../../parent/services/parentService';
import { queryKeys } from '../../../services/api/queryKeys';

type Props = NativeStackScreenProps<MoreStackParamList, 'Profile'>;

/** Student: their own profile. Parent: their family details (editable), every linked
 * child (tap to switch) and the login identity. */
export function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { isParent, children, activeChild, selectChild } = useParent();
  const parentQuery = useQuery({ queryKey: queryKeys.parentProfile, queryFn: fetchParentProfile, enabled: isParent });
  if (!user) return null;

  const parent = parentQuery.data;
  const accent = isParent ? colors.parent : colors.primary;
  const displayName = isParent
    ? parentDisplayName(parent) ?? 'Parent'
    : user.student
      ? `${user.student.firstName} ${user.student.lastName}`.trim()
      : user.email ?? 'Student';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.header, { backgroundColor: accent }]}>
        <View style={styles.blob} />
        <Avatar name={displayName} size={76} ring />
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <View style={styles.rolePill}>
          <Icon name={isParent ? 'family-restroom' : 'school'} size={13} color="#fff" />
          <Text style={styles.roleText}>{isParent ? 'PARENT' : 'STUDENT'}</Text>
        </View>
      </View>

      {isParent ? (
        <>
          <Text style={styles.section}>My children</Text>
          <View style={styles.group}>
            {children.map((c, i) => {
              const active = c.id === activeChild?.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => selectChild(c.id)}
                  style={[styles.childRow, i > 0 && styles.divider]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Avatar name={childName(c)} size={42} />
                  <View style={styles.flex}>
                    <Text style={styles.childName}>{childName(c)}</Text>
                    <Text style={styles.childMeta}>
                      {childClassLabel(c) || 'Class not assigned'}
                      {c.relation ? ` · ${c.relation}` : ''}
                    </Text>
                  </View>
                  {active ? (
                    <Text style={styles.viewing}>Viewing</Text>
                  ) : (
                    <Icon name="chevron-right" size={22} color={colors.disabled} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.sectionRow}>
            <Text style={[styles.section, styles.sectionInline]}>Family details</Text>
            {parent ? (
              <TouchableOpacity onPress={() => navigation.navigate('EditParentProfile')} style={styles.editBtn} accessibilityRole="button">
                <Icon name="edit" size={15} color={colors.parent} />
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.group}>
            {parentQuery.isLoading ? (
              <Text style={styles.placeholder}>Loading…</Text>
            ) : parentQuery.isError || !parent ? (
              <Text style={styles.placeholder} onPress={() => parentQuery.refetch()}>
                Couldn't load your details. Tap to retry.
              </Text>
            ) : (
              <>
                <Row icon="man" label="Father" value={[parent.fatherName, parent.fatherPhone].filter(Boolean).join(' · ') || '—'} />
                <Row icon="woman" label="Mother" value={[parent.motherName, parent.motherPhone].filter(Boolean).join(' · ') || '—'} divider />
                {parent.guardianName ? (
                  <Row icon="shield" label="Guardian" value={[parent.guardianName, parent.guardianPhone].filter(Boolean).join(' · ')} divider />
                ) : null}
                <Row icon="place" label="Address" value={parent.address || '—'} divider />
              </>
            )}
          </View>

          <Text style={styles.section}>Login</Text>
          <View style={styles.group}>
            <Row icon="phone-iphone" label="Mobile" value={user.mobile ?? '—'} />
            <Row icon="email" label="Email" value={user.email ?? '—'} divider />
            <Row icon="apartment" label="Institution" value={user.institution?.name ?? '—'} divider />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.section}>Academic</Text>
          <View style={styles.group}>
            <Row icon="badge" label="Roll number" value={user.student?.rollNumber ?? '—'} />
            <Row icon="class" label="Course" value={user.student?.course?.name ?? '—'} divider />
            <Row icon="groups" label="Section" value={user.student?.section?.name ?? '—'} divider />
            <Row icon="apartment" label="Institution" value={user.institution?.name ?? '—'} divider />
          </View>
          <Text style={styles.section}>Contact</Text>
          <View style={styles.group}>
            <Row icon="email" label="Email" value={user.email ?? '—'} />
            <Row icon="phone" label="Mobile" value={user.mobile ?? '—'} divider />
          </View>
        </>
      )}

      <Button label="Sign out" variant="danger" onPress={logout} style={styles.logout} />
    </ScrollView>
  );
}

function Row({ icon, label, value, divider }: { icon: string; label: string; value: string; divider?: boolean }) {
  return (
    <View style={[styles.row, divider && styles.divider]}>
      <Icon name={icon} size={20} color={colors.textSecondary} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  flex: { flex: 1, marginLeft: spacing.md },
  header: { alignItems: 'center', borderRadius: radius.xl, paddingVertical: spacing.lg, overflow: 'hidden', ...shadow(2) },
  blob: { position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -80, right: -60, backgroundColor: 'rgba(255,255,255,0.12)' },
  name: { ...typography.h2, color: '#fff', marginTop: spacing.sm, paddingHorizontal: spacing.md },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  roleText: { ...typography.overline, color: '#fff', marginLeft: 5 },
  section: { ...typography.overline, color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionInline: { flex: 1 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.parentLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    marginTop: spacing.lg - 4,
    marginBottom: spacing.sm - 4,
  },
  editText: { color: colors.parent, fontWeight: '700', fontSize: 13, marginLeft: 4 },
  placeholder: { ...typography.caption, color: colors.textSecondary, paddingVertical: spacing.md, textAlign: 'center' },
  group: { backgroundColor: colors.surface, borderRadius: radius.xl, paddingHorizontal: spacing.md, ...shadow(1) },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  label: { ...typography.body, color: colors.textSecondary, marginLeft: spacing.sm + 2 },
  value: { ...typography.body, color: colors.textPrimary, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: spacing.md },
  childRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 4 },
  childName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  childMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  viewing: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.parent,
    backgroundColor: colors.parentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  logout: { marginTop: spacing.lg },
});
