import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { colors, typography, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';

type RouteProps = RouteProp<AuthStackParamList, 'SignUp'>;
type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;
};

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const route = useRoute<RouteProps>();
  const userType = route.params?.userType ?? 'patient';
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
    const { firstName, lastName, email, phone, password, confirmPassword } = form;
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
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
        role: userType,
        phoneNumber: phone,
        fullName: `${firstName} ${lastName}`.trim(),
      });
      Alert.alert('Account created', 'You can now log in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (e: any) {
      Alert.alert('Registration failed', e.message ?? 'Please try again.');
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
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Registering as a{' '}
                <Text style={styles.roleTag}>
                  {userType === 'consultant' ? 'Doctor' : 'Patient'}
                </Text>
              </Text>
            </View>
            <Input label="First Name" placeholder="Enter your first name" value={form.firstName} onChangeText={set('firstName')} />
            <Input label="Last Name" placeholder="Enter your last name" value={form.lastName} onChangeText={set('lastName')} />
            <Input label="Email Address" placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={set('email')} />
            <Input label="Phone Number" placeholder="Enter your phone number" keyboardType="phone-pad" value={form.phone} onChangeText={set('phone')} />
            <Input label="Password" placeholder="Create a password" secureTextEntry showPasswordToggle value={form.password} onChangeText={set('password')} />
            <Input label="Confirm Password" placeholder="Confirm your password" secureTextEntry showPasswordToggle value={form.confirmPassword} onChangeText={set('confirmPassword')} />
            <Button label="Create Account" onPress={handleRegister} loading={loading} style={styles.btn} />
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Have an existing account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Log in</Text>
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
  roleTag: {
    fontFamily: typography.fonts.medium,
    color: colors.primary[950],
  },
  btn: { width: '100%', marginTop: spacing.base },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.base },
  loginText: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.md, color: '#454545' },
  loginLink: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.md, color: colors.primary[950] },
});
