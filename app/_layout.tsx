import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as TP,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { storage } from '@/utils/storage';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

export const unstable_settings = {
  initialRouteName: 'index',
  anchor: '(tabs)',
};

const FRESH_REGISTRATION = 'fresh_registration';

function RootLayoutNav() {
  const { isLoggedIn, token, isLoading: isAuthLoading, user } = useAuth();

  const [isNewReg, setIsNewReg] = useState(false);
  const [hasCheckedRegistration, setHasCheckedRegistration] = useState(false);

  const isInitializing = isAuthLoading || !hasCheckedRegistration;
  const isAuthenticated = isLoggedIn && token !== null;

  const { theme } = useTheme();

  useEffect(() => {
    let mounted = true;

    const checkFreshRegistration = async () => {
      try {
        const storedValue = await storage.getItem(FRESH_REGISTRATION);

        const freshRegistration = storedValue === '1';

        if (mounted) {
          setIsNewReg(freshRegistration);
          setHasCheckedRegistration(true);
        }

        // Consume the flag so it only applies once.
        // await storage.deleteItem(FRESH_REGISTRATION);
      } catch (error) {
        console.error('Failed to check fresh registration:', error);

        if (mounted) {
          setIsNewReg(false);
          setHasCheckedRegistration(true);
        }
      }
    };

    checkFreshRegistration();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isInitializing) {
      SplashScreen.hideAsync();
    }
  }, [isInitializing]);

  if (isInitializing) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Authentication */}
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen
          name="(auth)"
          options={{
            contentStyle: { backgroundColor: theme.colors.background },
            headerShown: false,
          }}
        />
      </Stack.Protected>

      {/* Fresh registration */}
      <Stack.Protected guard={isAuthenticated && isNewReg}>
        <Stack.Screen
          name="freshRegModal"
          options={{
            presentation: 'modal',
            title: 'Complete Registration',
            headerShown: false,
          }}
        />
      </Stack.Protected>

      {/* Normal authenticated flow */}
      <Stack.Protected
        guard={
          isAuthenticated &&
          !!user &&
          !isNewReg &&
          (user.role === 'patient' || !user.role)
        }
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            contentStyle: { backgroundColor: theme.colors.background },
            headerShown: false,
          }}
        />
      </Stack.Protected>

      {/* Modal route */}
      {/* <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
          title: 'Modal',
        }}
      /> */}
    </Stack>
  );
}

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <TP value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </AuthProvider>
      </ThemeProvider>
    </TP>
  );
}
