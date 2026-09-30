import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { apiSendVerificationEmail, apiVerifyEmail } from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';

const OTP_LENGTH = 6;

export default function VerifyEmailScreen() {
  const { profile, user, token, refreshProfile } = useAuth();
  const { theme: appTheme } = useTheme();
  // `sent=1` means the caller already requested a code (e.g. the profile banner).
  const { sent } = useLocalSearchParams<{ sent?: string }>();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);
  const autoSentRef = useRef(false);

  const resolvedUser = profile?.rest ?? user ?? null;
  const email = resolvedUser?.email ?? '';
  const userId = resolvedUser?.id ?? '';

  // Entering from somewhere that didn't send a code (e.g. the dashboard
  // prompt): send one now so there's something to type in.
  useEffect(() => {
    if (sent === '1' || !token || autoSentRef.current) return;
    autoSentRef.current = true;

    const timeoutId = setTimeout(() => {
      setResending(true);
      apiSendVerificationEmail(token)
        .catch((e: any) =>
          Alert.alert(
            'Could not send code',
            e?.message ?? 'Tap "Resend code" to try again.'
          )
        )
        .finally(() => setResending(false));
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [sent, token]);

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
      Alert.alert(
        'Email Verified',
        'Your email has been verified successfully.',
        [
          {
            text: 'OK',
            onPress: () =>
              router.canGoBack() ? router.back() : router.replace('/profile'),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert(
        'Verification failed',
        e?.message ?? 'Invalid or expired code. Try again.'
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!token) return;
    setResending(true);
    try {
      await apiSendVerificationEmail(token);
      Alert.alert(
        'Code sent',
        `A new verification code has been sent to ${email}.`
      );
    } catch (e: any) {
      Alert.alert('Failed to resend', e?.message ?? 'Please try again.');
    } finally {
      setResending(false);
    }
  };

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.xxl,
      },
      iconRow: { marginBottom: theme.spacing.xl },
      iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.surfaceCardLight,
        alignItems: 'center',
        justifyContent: 'center',
      },
      heading: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
      },
      subheading: {
        fontSize: theme.typography.sizes.base,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: theme.spacing.xxl,
      },
      emailText: {
        fontWeight: '500',
        color: theme.colors.text,
      },
      otpRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.xxl,
      },
      otpBox: {
        width: 48,
        height: 56,
        borderRadius: theme.radius.md,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceCard,
        textAlign: 'center',
        fontSize: theme.typography.sizes.lg,
        fontWeight: 'bold',
        color: theme.colors.text,
      },
      otpBoxFilled: {
        borderColor: theme.colors.primary.mid,
        backgroundColor: theme.colors.surfaceCardLight,
      },
      verifyBtn: { width: '100%', marginBottom: theme.spacing.lg },
      resendRow: { marginTop: theme.spacing.sm },
      resendText: {
        fontSize: theme.typography.sizes.base,
        color: theme.colors.textSecondary,
      },
      resendLink: {
        fontWeight: '500',
        color: theme.colors.primary.mid,
      },
    })
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.iconRow}>
          <View style={styles.iconCircle}>
            <IconSymbol
              name="mail.stack.fill"
              size={36}
              color={appTheme.colors.primary.mid}
            />
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
              ref={(ref) => {
                inputs.current[i] = ref;
              }}
              style={[styles.otpBox, d ? styles.otpBoxFilled : null]}
              value={d}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, i)
              }
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

        <TouchableOpacity
          onPress={handleResend}
          disabled={resending}
          style={styles.resendRow}
        >
          {resending ? (
            <ActivityIndicator
              size="small"
              color={appTheme.colors.primary.mid}
            />
          ) : (
            <Text style={styles.resendText}>
              Didn&apos;t receive it?{' '}
              <Text style={styles.resendLink}>Resend code</Text>
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
