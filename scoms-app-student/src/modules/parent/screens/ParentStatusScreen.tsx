import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../../store/AuthContext';
import { useParent } from '../../../store/ParentContext';
import { Button } from '../../../components/Button';
import { colors, radius, spacing, typography } from '../../../constants/theme';

interface Props {
  kind: 'no-children' | 'error';
}

/** Full-screen state for a parent account that can't continue yet. */
export function ParentStatusScreen({ kind }: Props) {
  const { logout } = useAuth();
  const { reloadChildren } = useParent();
  const noChildren = kind === 'no-children';

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: noChildren ? colors.parentLight : colors.dangerLight }]}>
        <Icon name={noChildren ? 'person-search' : 'cloud-off'} size={44} color={noChildren ? colors.parent : colors.danger} />
      </View>
      <Text style={styles.title}>{noChildren ? 'No child linked yet' : "Couldn't load your children"}</Text>
      <Text style={styles.message}>
        {noChildren
          ? "Your parent account isn't linked to a student at this institution. Please ask the school office to link your child, then try again."
          : 'Please check your internet connection and try again.'}
      </Text>
      <Button label="Try again" onPress={reloadChildren} color={colors.parent} style={styles.button} />
      <Button label="Sign out" variant="secondary" onPress={logout} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background },
  iconWrap: { width: 96, height: 96, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  message: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg, lineHeight: 22 },
  button: { alignSelf: 'stretch', marginTop: spacing.sm },
});
