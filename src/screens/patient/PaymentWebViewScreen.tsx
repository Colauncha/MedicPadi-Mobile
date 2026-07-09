import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/core';
import { Header } from '../../components/Header';
import { colors } from '../../theme';
import { PatientStackParamList } from '../../navigation/types';

type Route = RouteProp<PatientStackParamList, 'PaymentWebView'>;

export const PaymentWebViewScreen = () => {
  const { params } = useRoute<Route>();

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Complete Payment" />
      <View style={styles.webviewContainer}>
        <WebView
          source={{ uri: params.url }}
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
