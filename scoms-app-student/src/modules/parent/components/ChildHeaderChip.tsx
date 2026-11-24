import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useParent } from '../../../store/ParentContext';
import { Avatar } from '../../../components/Avatar';
import { colors, radius, spacing } from '../../../constants/theme';
import { childName } from '../services/parentService';

/** Header-right pill on every screen in Parent View: shows whose data you're looking at,
 * and opens the switcher when the parent has more than one child. Renders nothing for
 * students. */
export function ChildHeaderChip() {
  const { isParent, activeChild, children, openSwitcher } = useParent();
  if (!isParent || !activeChild) return null;

  const name = childName(activeChild);
  const canSwitch = children.length > 1;

  return (
    <TouchableOpacity
      onPress={canSwitch ? openSwitcher : undefined}
      disabled={!canSwitch}
      activeOpacity={0.8}
      style={styles.chip}
      accessibilityRole="button"
      accessibilityLabel={canSwitch ? `Viewing ${name}. Tap to switch child` : `Viewing ${name}`}
    >
      <Avatar name={name} size={24} />
      <Text style={styles.text} numberOfLines={1}>
        {activeChild.firstName}
      </Text>
      {canSwitch && <Icon name="swap-horiz" size={16} color={colors.parent} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.parentLight,
    borderRadius: radius.full,
    paddingLeft: 3,
    paddingRight: spacing.sm,
    paddingVertical: 3,
    marginRight: spacing.sm,
    maxWidth: 150,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  text: { color: colors.parentDark, fontWeight: '700', fontSize: 13, marginHorizontal: 6, flexShrink: 1 },
});
