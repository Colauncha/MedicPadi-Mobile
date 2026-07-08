import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { colors, typography, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      setLoading(false);
      return;
    }
    try {
      await login(email, password);
    } catch (e: any) {
      Alert.alert('Login failed', e.message ?? 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Log in today and enjoy seamless operations</Text>
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
            <Button label="Log in" onPress={handleLogin} loading={loading} style={styles.btn} />
            <TouchableOpacity style={styles.forgotRow} onPress={() => {}}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an existing account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp', {})}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.purple[200] },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.base },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
  },
  header: { marginBottom: spacing.xl },
  title: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  forgotRow: { alignSelf: 'flex-end', marginBottom: spacing.base },
  forgotText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.primary[800],
  },
  btn: { width: '100%' },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.base,
    flexWrap: 'wrap',
  },
  signupText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: '#454545',
  },
  signupLink: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.primary[950],
  },
});
