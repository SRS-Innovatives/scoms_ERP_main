import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, radius, spacing, typography } from '../constants/theme';

interface Props {
  label: string;
  icon: string;
  accent: { solid: string; soft: string };
  onPress: () => void;
  /** Small count bubble on the icon (e.g. items waiting) */
  badge?: number;
}

/** Quick-access grid item: a coloured rounded icon with a label underneath. */
export function IconTile({ label, icon, accent, onPress, badge }: Props) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={label}>
      <View style={[styles.icon, { backgroundColor: accent.soft }]}>
        <Icon name={icon} size={26} color={accent.solid} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: { width: '25%', alignItems: 'center', marginBottom: spacing.md, paddingHorizontal: 2 },
  icon: { width: 56, height: 56, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  label: { ...typography.caption, fontWeight: '600', color: colors.textPrimary, marginTop: spacing.xs + 2, textAlign: 'center' },
});
