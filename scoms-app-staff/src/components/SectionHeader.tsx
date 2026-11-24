import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';

interface Props {
  title: string;
  /** Optional link on the right, e.g. "See all" */
  action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, action }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action ? (
        <TouchableOpacity onPress={action.onPress} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.action}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  title: { ...typography.h3, fontWeight: '700', color: colors.textPrimary },
  action: { ...typography.caption, fontWeight: '700', color: colors.primary },
});
