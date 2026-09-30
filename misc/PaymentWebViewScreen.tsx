import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/core';
import { Header } from '../../components/Header';
import { colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { PatientStackParamList } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiVerifyTransaction } from '../../services/api';

type Nav = NativeStackNavigationProp<PatientStackParamList>;
type Route = RouteProp<PatientStackParamList, 'PaymentWebView'>;

export const PaymentWebViewScreen = () => {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { token } = useAuth();

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
    console.log(
      'Payment window closed/redirected. Reference:',
      params?.reference
    );
    if (!params?.reference || !token) return;

    try {
      const response = await apiVerifyTransaction(params.reference, token);

      if (response.status && response.data.status === 'success') {
        navigation.navigate('BookingDetails', {
          bookingId: response.data.meta.source_id,
          doctorId: response.data.meta.provider_id,
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
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Complete Payment" />
      <View style={styles.webviewContainer}>
        <WebView
          source={{ uri: params.url }}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.primary[950]} />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  webviewContainer: { flex: 1 },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
