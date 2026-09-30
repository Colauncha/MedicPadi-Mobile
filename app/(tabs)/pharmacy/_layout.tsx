import { useTheme } from '@/theme/ThemeProvider';
import { Stack } from 'expo-router';

export const PharmacyPage = () => {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Pharmacy' }} />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          title: 'Drug Details',
          headerBackVisible: true,
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

export default PharmacyPage;
