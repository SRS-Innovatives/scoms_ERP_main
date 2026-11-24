import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, radius, spacing, typography } from '../constants/theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  /** MaterialIcons name shown at the start of the field */
  icon?: string;
}

export function TextField({ label, error, icon, style, secureTextEntry, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, { borderColor }, focused && styles.fieldFocused]}>
        {icon ? <Icon name={icon} size={20} color={focused ? colors.primary : colors.textSecondary} style={styles.icon} /> : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={secureTextEntry && !revealed}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setRevealed((v) => !v)}
            style={styles.reveal}
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
          >
            <Icon name={revealed ? 'visibility-off' : 'visibility'} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { ...typography.caption, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs + 2 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52, // grows for multiline inputs
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
  },
  fieldFocused: { backgroundColor: colors.surface },
  icon: { marginRight: spacing.sm },
  input: { flex: 1, color: colors.textPrimary, paddingVertical: 12, ...typography.body },
  reveal: { paddingLeft: spacing.sm, paddingVertical: spacing.sm },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
});
