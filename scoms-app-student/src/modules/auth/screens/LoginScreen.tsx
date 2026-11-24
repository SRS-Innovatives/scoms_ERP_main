import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { colors, radius, shadow, spacing, typography } from '../../../constants/theme';
import { useAuth } from '../../../store/AuthContext';
import { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!identifier || !password) {
      setError('Please enter your login ID and password.');
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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}>
          <View style={[styles.blob, styles.blobA]} />
          <View style={[styles.blob, styles.blobB]} />
          <View style={[styles.blob, styles.blobC]} />
          <View style={styles.logo}>
            <Icon name="school" size={34} color={colors.primary} />
          </View>
          <Text style={styles.brand}>SCOMS</Text>
          <Text style={styles.tagline}>Your school, in your pocket</Text>
          <View style={styles.audience}>
            <Audience icon="school" label="Students" />
            <Audience icon="family-restroom" label="Parents" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>Use the login details shared by your institution.</Text>

          <TextField
            label="Admission No. / Email / Mobile"
            icon="person-outline"
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

          <Button label="Sign In" onPress={onSubmit} loading={loading} style={styles.submit} />

          <Text style={styles.forgot} onPress={() => navigation.navigate('ForgotPassword')}>
            Forgot password?
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Audience({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.audiencePill}>
      <Icon name={icon} size={14} color="#fff" />
      <Text style={styles.audienceText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xl },
  hero: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingBottom: 90,
    borderBottomLeftRadius: radius.xl + 16,
    borderBottomRightRadius: radius.xl + 16,
    overflow: 'hidden',
  },
  blob: { position: 'absolute', borderRadius: 999 },
  blobA: { width: 260, height: 260, top: -110, right: -80, backgroundColor: 'rgba(255,255,255,0.10)' },
  blobB: { width: 180, height: 180, bottom: -70, left: -50, backgroundColor: 'rgba(124,58,237,0.45)' },
  blobC: { width: 90, height: 90, top: 60, left: 30, backgroundColor: 'rgba(6,182,212,0.35)' },
  logo: {
    width: 70,
    height: 70,
    borderRadius: radius.xl,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(3),
  },
  brand: { ...typography.display, color: '#fff', marginTop: spacing.md, letterSpacing: 2 },
  tagline: { ...typography.body, color: colors.textOnDarkMuted, marginTop: 2 },
  audience: { flexDirection: 'row', marginTop: spacing.md },
  audiencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 4,
    marginHorizontal: spacing.xs,
  },
  audienceText: { color: '#fff', fontWeight: '700', fontSize: 12, marginLeft: 5 },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: -60,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow(3),
  },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.lg },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  error: { color: colors.danger, marginLeft: spacing.sm, flex: 1, ...typography.caption, fontWeight: '600' },
  submit: { marginTop: spacing.xs },
  forgot: { ...typography.body, color: colors.primary, textAlign: 'center', marginTop: spacing.lg, fontWeight: '700' },
});
