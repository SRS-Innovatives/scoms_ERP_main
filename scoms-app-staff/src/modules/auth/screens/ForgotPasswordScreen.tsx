import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { colors, spacing, typography } from '../../../constants/theme';
import { forgotPassword, resetPassword, verifyOtp } from '../services/authService';
import { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

type Step = 'request' | 'verify' | 'reset' | 'done';

export function ForgotPasswordScreen({ navigation }: Props) {
  const [step, setStep] = useState<Step>('request');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRequest = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await forgotPassword(identifier);
      setMessage('If an account matches that identifier, a code has been emailed to it.');
      setStep('verify');
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await verifyOtp(identifier, otp);
      setStep('reset');
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await resetPassword(identifier, otp, newPassword);
      setStep('done');
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      {step === 'request' && (
        <>
          <TextField
            label="Employee Code / Email / Mobile"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
          />
          <Button label="Send Code" onPress={handleRequest} loading={loading} />
        </>
      )}

      {step === 'verify' && (
        <>
          <TextField label="6-digit Code" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
          <Button label="Verify Code" onPress={handleVerify} loading={loading} />
        </>
      )}

      {step === 'reset' && (
        <>
          <TextField label="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          <Button label="Reset Password" onPress={handleReset} loading={loading} />
        </>
      )}

      {step === 'done' && (
        <>
          <Text style={styles.message}>Password reset. Please sign in again.</Text>
          <Button label="Back to Sign In" onPress={() => navigation.navigate('Login')} />
        </>
      )}

      {step !== 'done' && (
        <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
          Back to Sign In
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', paddingHorizontal: spacing.lg },
  title: { ...typography.h1, color: colors.primary, textAlign: 'center', marginBottom: spacing.lg },
  message: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  link: { color: colors.primary, textAlign: 'center', marginTop: spacing.lg, ...typography.body },
});
