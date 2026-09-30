import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { colors, typography, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { apiSendVerificationEmail, apiVerifyEmail } from '../../services/api';

const OTP_LENGTH = 6;

export const VerifyEmailScreen: React.FC = () => {
  const { profile, token, refreshProfile } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  const resolvedUser = profile?.rest ?? null;
  const email = resolvedUser?.email ?? '';
  const userId = resolvedUser?.id ?? '';

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) {
      Alert.alert('Incomplete code', 'Please enter all 6 digits.');
      return;
    }
    if (!token || !userId) return;
    setVerifying(true);
    try {
      await apiVerifyEmail(userId, otp, token);
      await refreshProfile();
      Alert.alert('Email Verified', 'Your email has been verified successfully.');
    } catch (e: any) {
      Alert.alert('Verification failed', e?.message ?? 'Invalid or expired code. Try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!token) return;
    setResending(true);
    try {
      await apiSendVerificationEmail(token);
      Alert.alert('Code sent', `A new verification code has been sent to ${email}.`);
    } catch (e: any) {
      Alert.alert('Failed to resend', e?.message ?? 'Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Verify Email" showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.iconRow}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="mark-email-unread" size={36} color={colors.primary[800]} />
            </View>
          </View>

          <Text style={styles.heading}>Check your inbox</Text>
          <Text style={styles.subheading}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          <View style={styles.otpRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputs.current[i] = ref; }}
                style={[styles.otpBox, d ? styles.otpBoxFilled : null]}
                value={d}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                textContentType="oneTimeCode"
              />
            ))}
          </View>

          <Button
            label="Verify Email"
            variant="primary"
            size="lg"
            loading={verifying}
            onPress={handleVerify}
            style={styles.verifyBtn}
          />

          <TouchableOpacity onPress={handleResend} disabled={resending} style={styles.resendRow}>
            {resending ? (
              <ActivityIndicator size="small" color={colors.primary[800]} />
            ) : (
              <Text style={styles.resendText}>
                Didn't receive it?{' '}
                <Text style={styles.resendLink}>Resend code</Text>
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  iconRow: { marginBottom: spacing.xl },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xl,
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  subheading: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.light,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  emailText: {
    fontFamily: typography.fonts.medium,
    color: colors.text.dark,
  },
  otpRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    textAlign: 'center',
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.lg,
    color: colors.text.dark,
  },
  otpBoxFilled: {
    borderColor: colors.primary[800],
    backgroundColor: colors.cardLight,
  },
  verifyBtn: { width: '100%', marginBottom: spacing.lg },
  resendRow: { marginTop: spacing.sm },
  resendText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.light,
  },
  resendLink: {
    fontFamily: typography.fonts.medium,
    color: colors.primary[800],
  },
});
