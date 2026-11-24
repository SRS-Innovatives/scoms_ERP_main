import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { avatarPalette } from '../constants/theme';

interface Props {
  name: string;
  size?: number;
  /** Override the name-derived colour. */
  color?: string;
  /** Draw a white ring — for avatars sitting on a coloured header. */
  ring?: boolean;
  style?: ViewStyle;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

/** Same name → same colour, every time. */
export function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 2147483647;
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}

export function Avatar({ name, size = 44, color, ring, style }: Props) {
  const bg = color ?? colorForName(name);
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        ring && [styles.ring, { borderWidth: Math.max(2, size / 18) }],
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#FFFFFF', fontWeight: '800' },
  ring: { borderColor: '#FFFFFF' },
});
