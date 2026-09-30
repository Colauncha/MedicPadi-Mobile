import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { apiVerifyTransaction } from '@/services/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/hooks/useThemedStyle';

const PaymentWebViewScreen = () => {
  const { token } = useAuth();
  const { reference, url } = useLocalSearchParams();
  const { theme: appTheme } = useTheme();

  const handleNavigationStateChange = (state: WebViewNavigation) => {
    const { url } = state;

    console.log(url);
    // 1. Check if user was redirected to Paystack's success callback
    if (url.includes('medicpadi') || url.includes('callback')) {
      handlePaymentSuccess();
    }

    // 2. Optional: Check if user explicitly clicked a cancel/back button that matches your setup
    if (url.includes('cancel')) {
      handlePaymentCancel();
    }
  };

  const handlePaymentSuccess = async () => {
    if (!reference || !token) return;

    try {
      const response = await apiVerifyTransaction(reference as string, token);

      if (response.status && response.data.status === 'success') {
        // Replace the web view so "back" from the details doesn't reopen checkout.
        router.replace({
          pathname: '/appointments/[id]',
          params: { id: response.data.meta.source_id },
        });
      } else {
        console.log('Transaction not successful:', response.data.status);
      }
    } catch (e) {
      console.log('Failed to verify transaction:', e);
    }
  };

  const handlePaymentCancel = () => {
    console.log('Payment cancelled by user');
    router.back();
  };

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      webviewContainer: { flex: 1 },
      loading: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
      },
    })
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.webviewContainer}>
        <WebView
          source={{ uri: url as string }}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator
                size="large"
                color={appTheme.colors.primary.extraDeep}
              />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default PaymentWebViewScreen;
