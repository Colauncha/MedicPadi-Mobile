// import { useThemedStyles } from '@/hooks/useThemedStyle';
import { useTheme } from '@/theme/ThemeProvider';
import { Stack } from 'expo-router';
// import { StyleSheet } from 'react-native';

export const ProfilePage = () => {
  // const styles = useThemedStyles((theme) => StyleSheet.create({}));
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="editProfile" options={{ headerShown: false }} />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: true,
          title: 'Settings',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fonts?.rounded,
            fontSize: theme.typography.sizes.xl,
            fontWeight: 'bold',
          },
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      />
    </Stack>
  );
};

export default ProfilePage;
