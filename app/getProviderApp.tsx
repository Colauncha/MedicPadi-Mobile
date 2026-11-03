import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppAlert } from '@/components/ui/alert';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { toLabel } from '@/utils/orderStatus';

const MedicpadiLogo = require('../assets/images/medicpadi-logo.png');

// Identifiers from MedicPadi-mobile-providers/app.json.
const PROVIDER_APP_SCHEME = 'medicpadimobileproviders://';
const ANDROID_PACKAGE = 'com.colauncha_dev.medicpadimobileproviders';
// TODO: replace with the real listing (https://apps.apple.com/app/id<APP_ID>)
// once the provider app is published on the App Store.
const IOS_STORE_URL =
  'https://apps.apple.com/search?term=MedicPadi%20Providers';

const STORE_URL = Platform.select({
  ios: IOS_STORE_URL,
  default: `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`,
});

const FEATURES = [
  'Manage appointments and consultations',
  'Receive and fulfil patient requests',
  'Track your earnings and payouts',
];

const GetProviderApp = () => {
  const { user, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      content: {
        flex: 1,
        justifyContent: 'center',
        padding: theme.spacing.base,
        gap: theme.spacing.base,
      },
      logo: { width: 160, height: 48, alignSelf: 'center' },
      emoji: { fontSize: 56, textAlign: 'center' },
      title: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: '600',
        color: theme.colors.text,
        textAlign: 'center',
      },
      body: {
        fontSize: theme.typography.sizes.base,
        color: theme.colors.textMuted,
        textAlign: 'center',
        lineHeight: 22,
      },
      card: {
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.base,
        gap: theme.spacing.sm,
      },
      featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
      },
      featureCheck: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '700',
        color: theme.colors.success,
      },
      featureText: {
        flex: 1,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
      },
      account: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        textAlign: 'center',
      },
      accountEmail: { color: theme.colors.text, fontWeight: '500' },
      actions: {
        padding: theme.spacing.base,
        gap: theme.spacing.sm,
      },
    })
  );

  // Open the provider app if it's installed, otherwise its store listing.
  const openProviderApp = async () => {
    try {
      await Linking.openURL(PROVIDER_APP_SCHEME);
    } catch {
      try {
        await Linking.openURL(STORE_URL);
      } catch {
        AppAlert.alert(
          "Couldn't open the store",
          'Search for "MedicPadi Providers" in your app store.',
          [],
          { variant: 'error' }
        );
      }
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
    }
  };

  const roleLabel = user?.role ? toLabel(user.role).toLowerCase() : 'provider';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={MedicpadiLogo}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.emoji}>🩺</Text>
        <Text style={styles.title}>This app is for patients</Text>
        <Text style={styles.body}>
          You&apos;re signed in with a {roleLabel} account. Use the MedicPadi
          Providers app to manage your practice.
        </Text>

        <View style={styles.card}>
          {FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {user?.email ? (
          <Text style={styles.account}>
            Signed in as <Text style={styles.accountEmail}>{user.email}</Text>
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button label="Get the Providers app" onPress={openProviderApp} />
        <Button
          label="Sign out"
          variant="outline"
          onPress={handleSignOut}
          loading={signingOut}
          disabled={signingOut}
        />
      </View>
    </SafeAreaView>
  );
};

export default GetProviderApp;
