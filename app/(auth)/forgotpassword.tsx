import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/Input';
import RadioButtons, { ChoiceData } from '@/components/ui/RadioButton';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { apiRequestPasswordReset } from '@/services/api';
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

const ForgotPassword = () => {
  const [choice, setChoice] = useState<ChoiceData['id']>('email');
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    if (!value) {
      Alert.alert('Missing fields', 'Please enter your email or phone number.');
      setLoading(false);
      return;
    }
    try {
      const resp = await apiRequestPasswordReset(value);
      Alert.alert('Api response', resp.message);
      router.push(`/forgotpasswordotp?email=${value}`);
    } catch (e: any) {
      Alert.alert('Recent password failed', e.message ?? 'Please try again.');
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
      btn: { width: '100%' },
      goBack: {
        flex: 1,
        flexDirection: 'row',
        gap: 2,
        alignItems: 'center',
        marginBottom: theme.spacing.md,
      },
      goBackIcon: {
        color: theme.colors.textMuted,
      },
      goBackText: {
        color: theme.colors.textMuted,
        fontSize: theme.typography.sizes.sm,
      },

      formIcons: {
        color: theme.colors.primary.deep,
        backgroundColor: theme.colors.primary.base,
        padding: theme.spacing.md,
        borderRadius: theme.radius.full,
        // flex: 1,
      },
      formFields: {
        width: '100%',
        gap: theme.spacing.sm,
      },
      formRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        width: '100%',
        // paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.xs,
        borderRadius: theme.radius.md,
      },
      formRowSelected: {
        borderColor: theme.colors.primary.base,
        backgroundColor:
          theme.colors.primary.shallow ?? theme.colors.surfaceCard,
      },
      formTextWrap: {
        flex: 4,
        minWidth: 0,
      },
      formLabel: {
        fontSize: theme.typography.sizes.base,
        fontFamily: theme.typography.fonts?.sans,
        color: theme.colors.text,
        fontWeight: '500',
      },
      formSubLabel: {
        fontSize: theme.typography.sizes.xs,
        fontFamily: theme.typography.fonts?.sans,
        color: theme.colors.textSecondary, // was theme.colors.text — now correctly de-emphasized
        marginTop: 2,
      },
      formInput: {
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: theme.spacing.sm,
      },
    })
  );

  const choiceData: ChoiceData[] = [
    {
      id: 'email',
      primaryLabel: 'Reset Via email',
      secondaryLabel: 'A reset otp will be sent to your email',
      icon: 'mail.fill',
      iconSize: 24,
      primaryLabelStyle: styles.formLabel,
      secondaryLabelStyle: styles.formSubLabel,
      rowStyle: styles.formRow,
      iconStyle: styles.formIcons,
    },
    {
      id: 'sms',
      primaryLabel: 'Reset Via sms',
      secondaryLabel: 'A reset otp will be sent to your phone number',
      icon: 'phone.and.waveform.fill',
      iconSize: 24,
      disabled: true,
      primaryLabelStyle: styles.formLabel,
      secondaryLabelStyle: styles.formSubLabel,
      rowStyle: styles.formRow,
      iconStyle: styles.formIcons,
    },
  ];

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
              <Text style={styles.title}>Forgot Password</Text>
              <Text style={styles.subtitle}>
                Select an option to get reset link
              </Text>
            </View>

            <View style={styles.formFields}>
              <RadioButtons
                defaultValue={choice}
                data={choiceData}
                onChange={setChoice}
                innerSize={12}
                outerSize={24}
              />
              <View style={styles.formInput}>
                {choice === 'email' ? (
                  <Input
                    label="Email"
                    placeholder="enter your email"
                    value={value}
                    onChangeText={setValue}
                  />
                ) : choice === 'sms' ? (
                  <Input
                    label="SMS"
                    placeholder="currently unavaliable. Coming soon..."
                    disabled={true}
                  />
                ) : null}
              </View>
              <Button
                label="Get OTP"
                onPress={handleSubmit}
                loading={loading}
                style={styles.btn}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;
