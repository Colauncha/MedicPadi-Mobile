import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  // const { redirect } = useLocalSearchParams();

  const handleLogin = async () => {
    setLoading(true);
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      setLoading(false);
      return;
    }
    try {
      await login(email, password);
      // router.replace(redirect[0])
    } catch (e: any) {
      Alert.alert(
        'Login failed',
        e.message ?? 'Invalid credentials. Please try again.'
      );
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
      forgotRow: { alignSelf: 'flex-end', marginBottom: theme.spacing.base },
      forgotText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        marginTop: theme.spacing.base,
        color: theme.colors.primary.deep,
      },
      btn: { width: '100%' },
      signupRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.base,
        flexWrap: 'wrap',
      },
      signupText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.md,
        color: '#454545',
      },
      signupLink: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.primary.extraDeep,
      },
      goBack: {
        flex: 1,
        flexDirection: 'row',
        gap: 2,
        alignItems: 'center',
        marginBottom: theme.spacing.base,
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
          <View style={styles.card}>
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
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Log in today and enjoy seamless operations
              </Text>
            </View>
            <Input
              label="Email Address"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              showPasswordToggle
              value={password}
              onChangeText={setPassword}
            />
            <Button
              label="Log in"
              onPress={handleLogin}
              loading={loading}
              style={styles.btn}
            />
            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => router.push('/forgotpassword')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>
                Don&apos;t have an existing account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;
