import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useParent } from '../../../store/ParentContext';
import { useAuth } from '../../../store/AuthContext';
import { Avatar } from '../../../components/Avatar';
import { colors, radius, shadow, spacing, typography } from '../../../constants/theme';
import { childClassLabel, childName } from '../services/parentService';

/** First screen for a parent with 2+ children and no saved choice. */
export function ChildPickerScreen() {
  const { children, selectChild } = useParent();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
        <View style={[styles.blob, styles.blobA]} />
        <View style={[styles.blob, styles.blobB]} />
        <View style={styles.pill}>
          <Icon name="family-restroom" size={14} color="#fff" />
          <Text style={styles.pillText}>PARENT VIEW</Text>
        </View>
        <Text style={styles.heroTitle}>Welcome!</Text>
        <Text style={styles.heroSubtitle}>Whose details would you like to see?</Text>
        {user?.institution?.name ? <Text style={styles.institution}>{user.institution.name}</Text> : null}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {children.map((c) => {
          const name = childName(c);
          return (
            <TouchableOpacity key={c.id} activeOpacity={0.85} onPress={() => selectChild(c.id)} style={styles.card} accessibilityRole="button">
              <Avatar name={name} size={60} />
              <View style={styles.cardText}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.meta}>{childClassLabel(c) || 'Class not assigned'}</Text>
                <View style={styles.tags}>
                  {c.rollNumber ? <Text style={styles.tag}>Roll {c.rollNumber}</Text> : null}
                  {c.relation ? <Text style={[styles.tag, styles.tagParent]}>{c.relation}</Text> : null}
                </View>
              </View>
              <View style={styles.go}>
                <Icon name="arrow-forward" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          );
        })}
        <Text style={styles.hint}>You can switch between children any time from the top of each screen.</Text>
        <Text style={styles.logout} onPress={logout}>
          Not you? Sign out
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundColor: colors.parent,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + spacing.md,
    borderBottomLeftRadius: radius.xl + 8,
    borderBottomRightRadius: radius.xl + 8,
    overflow: 'hidden',
  },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)' },
  blobA: { width: 220, height: 220, top: -70, right: -60 },
  blobB: { width: 140, height: 140, bottom: -50, left: -30, backgroundColor: 'rgba(236,72,153,0.25)' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    marginBottom: spacing.md,
  },
  pillText: { ...typography.overline, color: '#fff', marginLeft: 6 },
  heroTitle: { ...typography.display, color: '#fff' },
  heroSubtitle: { ...typography.body, color: colors.textOnDarkMuted, marginTop: spacing.xs },
  institution: { ...typography.caption, color: colors.textOnDarkMuted, marginTop: spacing.sm },
  list: { padding: spacing.md, paddingTop: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow(2),
  },
  cardText: { flex: 1, marginLeft: spacing.md },
  name: { ...typography.h2, color: colors.textPrimary },
  meta: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  tags: { flexDirection: 'row', marginTop: spacing.sm },
  tag: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primaryDark,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginRight: spacing.xs,
    overflow: 'hidden',
  },
  tagParent: { color: colors.parentDark, backgroundColor: colors.parentLight },
  go: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.parent, alignItems: 'center', justifyContent: 'center' },
  hint: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  logout: { ...typography.body, color: colors.parent, fontWeight: '600', textAlign: 'center', marginTop: spacing.lg, padding: spacing.sm },
});
