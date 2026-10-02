// import { useThemedStyles } from '@/hooks/useThemedStyle';
import { useTheme } from '@/theme/ThemeProvider';
import { Stack } from 'expo-router';
// import { StyleSheet } from 'react-native';

export const ProfilePage = () => {
  // const styles = useThemedStyles((theme) => StyleSheet.create({}));
  const { theme } = useTheme();

  const titledHeader = (title: string) => ({
    headerShown: true,
    title,
    headerTitleAlign: 'center' as const,
    headerTitleStyle: {
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fonts?.rounded,
      fontSize: theme.typography.sizes.xl,
      fontWeight: 'bold' as const,
    },
    headerStyle: {
      backgroundColor: theme.colors.background,
    },
  });

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="editProfile" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={titledHeader('Settings')} />
      <Stack.Screen
        name="medicalHistory"
        options={titledHeader('Medical History')}
      />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="verifyEmail" options={titledHeader('Verify Email')} />
    </Stack>
  );
};

export default ProfilePage;
