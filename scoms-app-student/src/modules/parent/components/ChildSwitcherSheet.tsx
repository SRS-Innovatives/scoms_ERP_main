import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useParent } from '../../../store/ParentContext';
import { Avatar } from '../../../components/Avatar';
import { colors, radius, shadow, spacing, typography } from '../../../constants/theme';
import { childClassLabel, childName } from '../services/parentService';

/** Bottom sheet listing the parent's children — mounted once at the root, opened from the
 * header chip or the dashboard. */
export function ChildSwitcherSheet() {
  const { switcherOpen, closeSwitcher, children, activeChild, selectChild } = useParent();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={switcherOpen} transparent animationType="slide" onRequestClose={closeSwitcher}>
      <Pressable style={styles.backdrop} onPress={closeSwitcher} accessibilityLabel="Close child switcher" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Switch child</Text>
        <Text style={styles.subtitle}>Everything in the app will show this child's details.</Text>
        <ScrollView style={styles.list}>
          {children.map((c) => {
            const active = c.id === activeChild?.id;
            const name = childName(c);
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => selectChild(c.id)}
                activeOpacity={0.85}
                style={[styles.row, active && styles.rowActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Avatar name={name} size={48} />
                <View style={styles.rowText}>
                  <Text style={styles.name}>{name}</Text>
                  <Text style={styles.meta}>{childClassLabel(c) || 'Class not assigned'}</Text>
                </View>
                {active ? (
                  <View style={styles.activeBadge}>
                    <Icon name="check" size={16} color="#fff" />
                  </View>
                ) : (
                  <Icon name="chevron-right" size={24} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    maxHeight: '75%',
    ...shadow(3),
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: spacing.md },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md },
  list: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rowActive: { backgroundColor: colors.parentLight, borderColor: colors.parent },
  rowText: { flex: 1, marginLeft: spacing.md },
  name: { ...typography.h3, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  activeBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.parent, alignItems: 'center', justifyContent: 'center' },
});
