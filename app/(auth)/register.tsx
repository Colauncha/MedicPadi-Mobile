import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { storage } from '@/utils/storage';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FRESH_REGISTRATION = 'fresh_registration';

const Register = () => {
  // const { usertype: userType } = useLocalSearchParams();
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [key]: v }));
  };

  const handleRegister = async () => {
    setLoading(true);
    const { firstName, lastName, email, phone, password, confirmPassword } =
      form;
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      setLoading(false);
      return;
    }
    try {
      await register({
        email,
        password,
        role: 'patient',
        phoneNumber: phone,
        fullName: `${firstName} ${lastName}`.trim(),
      });

      if (Platform.OS === 'web') {
        storage.setItem(FRESH_REGISTRATION, '1').catch(() => {});
        router.navigate('/login');
      }

      Alert.alert('Account created', 'You can now log in.', [
        {
          text: 'OK',
          onPress: () => {
            storage.setItem(FRESH_REGISTRATION, '1').catch(() => {});
            router.navigate('/login');
          },
        },
      ]);
    } catch (e: any) {
      console.log(e);
      Alert.alert('Registration failed', e.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      scroll: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.base,
      },
      card: {
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.xl,
        borderColor: theme.colors.border,
        borderWidth: 1,
        padding: theme.spacing.xl,
        width: '100%',
        maxWidth: 360,
      },
      header: {
        marginBottom: theme.spacing.xl,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      title: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.xl,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
      },
      subtitle: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
      },
      roleTag: {
        fontFamily: theme.typography.fonts?.sans,
        color: theme.colors.primary.extraDeep,
        marginLeft: theme.spacing.md,
      },
      btn: { width: '100%', marginTop: theme.spacing.base },
      loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.base,
      },
      loginText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.md,
        color: '#454545',
      },
      loginLink: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.primary.extraDeep,
      },

      goBack: {
        flex: 1,
        flexDirection: 'row',
        gap: 2,
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
      },
      goBackIcon: {
        color: theme.colors.textMuted,
      },
      goBackText: {
        color: theme.colors.textMuted,
        fontSize: theme.typography.sizes.sm,
      },
    })
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.card}>
            <TouchableOpacity onPress={handleGoBack} style={styles.goBack}>
              <IconSymbol
                name="chevron.left"
                style={styles.goBackIcon}
                size={12}
              />
              <ThemedText type="subtitle" style={styles.goBackText}>
                Go Back
              </ThemedText>
            </TouchableOpacity>
            <View style={styles.header}>
              <ThemedText style={styles.title} type="title">
                Create Account
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Registering as a{' '}
                <Link href={{ pathname: '/usertype' }}>
                  <ThemedText style={styles.roleTag}>Patient</ThemedText>
                </Link>
              </ThemedText>
            </View>
            <Input
              label="First Name"
              placeholder="Enter your first name"
              value={form.firstName}
              onChangeText={set('firstName')}
            />
            <Input
              label="Last Name"
              placeholder="Enter your last name"
              value={form.lastName}
              onChangeText={set('lastName')}
            />
            <Input
              label="Email Address"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={set('email')}
            />
            <Input
              label="Phone Number"
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={set('phone')}
            />
            <Input
              label="Password"
              placeholder="Create a password"
              secureTextEntry
              showPasswordToggle
              value={form.password}
              onChangeText={set('password')}
            />
            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              secureTextEntry
              showPasswordToggle
              value={form.confirmPassword}
              onChangeText={set('confirmPassword')}
            />
            <Button
              label="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={styles.btn}
            />
            <View style={styles.loginRow}>
              <ThemedText style={styles.loginText}>
                Have an existing account?{' '}
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <ThemedText style={styles.loginLink}>Log in</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Register;
