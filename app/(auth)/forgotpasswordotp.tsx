import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/Input';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { apiRequestPasswordReset, apiResetPassword } from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const OTP_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 8;

const Forgotpasswordotp = () => {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewpassword, setConfirmNewPassword] = useState('');
  const inputs = useRef<(TextInput | null)[]>([]);

  const showPassInput = digits.join('').length === OTP_LENGTH;
  const [errors, setErrors] = useState({
    newPassError: '',
    confirmNewPassError: '',
    apiError: '',
  });

  const validatePassword = (password: string): string => {
    if (!password) return '';
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      return 'Password must contain both letters and numbers';
    }
    return '';
  };

  const validateConfirmPassword = (
    password: string,
    confirm: string
  ): string => {
    if (!confirm) return '';
    if (password !== confirm) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handleNewPassInput = (input: string) => {
    setNewPassword(input);
    setErrors((prev) => ({
      ...prev,
      newPassError: validatePassword(input),
      confirmNewPassError: validateConfirmPassword(input, confirmNewpassword),
    }));
  };

  const handleConfirmNewPassInput = (input: string) => {
    setConfirmNewPassword(input);
    setErrors((prev) => ({
      ...prev,
      confirmNewPassError: validateConfirmPassword(newPassword, input),
    }));
  };

  const { email } = useLocalSearchParams();

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

    const newPassError = validatePassword(newPassword);
    const confirmNewPassError = validateConfirmPassword(
      newPassword,
      confirmNewpassword
    );

    if (!newPassword || !confirmNewpassword) {
      Alert.alert('Missing password', 'Please fill in both password fields.');
      return;
    }

    if (newPassError || confirmNewPassError) {
      setErrors((prev) => ({ ...prev, newPassError, confirmNewPassError }));
      return;
    }

    setVerifying(true);
    try {
      await apiResetPassword(email as string, parseInt(otp, 10), newPassword);
      Alert.alert(
        'Email Verified',
        'Your email has been verified successfully.'
      );
      router.replace('/login');
    } catch (e: any) {
      Alert.alert(
        'Verification failed',
        e?.message ?? 'Invalid or expired token. Try again.'
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await apiRequestPasswordReset(email as string);
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

  const { theme: appTheme } = useTheme();
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
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.xl,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
      },
      subheading: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.text,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: theme.spacing.xxl,
      },
      emailText: {
        fontFamily: theme.typography.fonts?.sans,
        color: theme.colors.textSecondary,
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
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.lg,
        color: theme.colors.textSecondary,
      },
      otpBoxFilled: {
        borderColor: theme.colors.primary.deep,
        backgroundColor: theme.colors.surfaceCardLight,
      },
      verifyBtn: { width: '100%', marginBottom: theme.spacing.lg },
      resendRow: { marginTop: theme.spacing.sm },
      resendText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.text,
      },
      resendLink: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.md,
        fontWeight: '700',
        color: theme.colors.primary.deep,
      },
      activityIndicator: {
        color: theme.colors.primary.deep,
      },
      icon: {
        color: theme.colors.primary.deep,
      },
      passView: {
        width: '100%',
      },
      passInput: {
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.md,
      },
    })
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* <Header title="Verify Email" showBack /> */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconRow}>
            <View style={styles.iconCircle}>
              <IconSymbol
                name="mail.stack.fill"
                size={36}
                color={appTheme.colors.primary.deep}
              />
            </View>
          </View>

          <Text style={styles.heading}>Check your inbox</Text>
          <Text style={styles.subheading}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
            <Link
              href={{ pathname: '/forgotpassword' }}
              style={styles.resendLink}
            >
              {' '}
              edit?
            </Link>
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

          {showPassInput && (
            <View style={styles.passView}>
              <Input
                secureTextEntry={true}
                label="New password"
                value={newPassword}
                onChangeText={handleNewPassInput}
                showPasswordToggle
                style={styles.passInput}
                placeholder="Enter new password"
                hint="Should not be less than 8 chars Alphanumeric"
                error={
                  errors.newPassError !== '' ? errors.newPassError : undefined
                }
              />
              <Input
                secureTextEntry={true}
                label="Confirm new password"
                value={confirmNewpassword}
                onChangeText={handleConfirmNewPassInput}
                showPasswordToggle
                style={styles.passInput}
                placeholder="Confirm new password"
                hint="Should not be less than 8 chars Alphanumeric"
                error={
                  errors.confirmNewPassError !== ''
                    ? errors.confirmNewPassError
                    : undefined
                }
              />
            </View>
          )}

          <Button
            label="Update password"
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
                color={appTheme.colors.primary.deep}
              />
            ) : (
              <Text style={styles.resendText}>
                Didn&apos;t receive it?{' '}
                <Text style={styles.resendLink}>Resend code</Text>
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Forgotpasswordotp;
