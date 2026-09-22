// import { Tabs } from 'expo-router';
import { storage } from '@/utils/storage';
import { router, Stack } from 'expo-router';
import React, { useEffect } from 'react';

const ONBOARDING_KEY = 'mp_onboarding_done';

export default function AuthLayout() {
  useEffect(() => {
    (async () => {
      const firstTimer = await storage.getItem(ONBOARDING_KEY);
      if (Boolean(parseInt(firstTimer ?? '0', 10))) router.replace('/login');
    })();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="usertype" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="forgotpassword" options={{ headerShown: false }} />
      <Stack.Screen name="forgotpasswordotp" options={{ headerShown: false }} />
    </Stack>
  );
}
