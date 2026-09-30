// import { useThemedStyles } from '@/hooks/useThemedStyle';
import { useTheme } from '@/theme/ThemeProvider';
import { Stack } from 'expo-router';
// import { StyleSheet } from 'react-native';

export const LabPage = () => {
  // const styles = useThemedStyles((theme) => StyleSheet.create({}));
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          // headerShown: true,
          title: 'Labs',
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
      <Stack.Screen
        name="[id]"
        options={{
          // headerShown: true,
          title: 'Appointment Details',
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

export default LabPage;
