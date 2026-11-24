import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { colors, radius, shadow, spacing, typography } from '../../../constants/theme';
import { useAuth } from '../../../store/AuthContext';
import { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!identifier.trim() || !password) {
      setError('Please enter your employee ID and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(identifier.trim(), password);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
        <View style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}>
          <View style={[styles.blob, styles.blobA]} />
          <View style={[styles.blob, styles.blobB]} />
          <View style={styles.logo}>
            <Icon name="school" size={36} color={colors.primary} />
          </View>
          <Text style={styles.brand}>SCOMS Staff</Text>
          <Text style={styles.tagline}>Your classes, attendance and desk — in one place</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in with your staff account</Text>

          <TextField
            label="Employee code, email or mobile"
            icon="badge"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <TextField
            label="Password"
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />
          {error ? (
            <View style={styles.errorBox}>
              <Icon name="error-outline" size={18} color={colors.danger} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <Button label="Sign in" icon="login" onPress={onSubmit} loading={loading} />

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotWrap} accessibilityRole="button">
            <Text style={styles.forgot}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xl },
  hero: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingBottom: 72,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radius.xl + 12,
    borderBottomRightRadius: radius.xl + 12,
    overflow: 'hidden',
  },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)' },
  blobA: { width: 260, height: 260, top: -110, right: -80 },
  blobB: { width: 170, height: 170, bottom: -70, left: -50, backgroundColor: 'rgba(255,255,255,0.07)' },
  logo: { width: 72, height: 72, borderRadius: radius.xl, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow(2) },
  brand: { ...typography.display, color: '#fff', marginTop: spacing.md },
  tagline: { ...typography.body, color: colors.textOnDarkMuted, marginTop: spacing.xs, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginHorizontal: spacing.md,
    marginTop: -48,
    padding: spacing.lg,
    ...shadow(3),
  },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.lg },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  error: { ...typography.caption, color: colors.danger, marginLeft: spacing.sm, flex: 1 },
  forgotWrap: { alignSelf: 'center', marginTop: spacing.lg, padding: spacing.xs },
  forgot: { ...typography.body, fontWeight: '700', color: colors.primary },
});
