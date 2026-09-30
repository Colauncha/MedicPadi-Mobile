// import { useThemedStyles } from '@/hooks/useThemedStyle';
import { useTheme } from '@/theme/ThemeProvider';
import { Stack } from 'expo-router';
// import { StyleSheet } from 'react-native';

export const AppointmentsPage = () => {
  // const styles = useThemedStyles((theme) => StyleSheet.create({}));
  const { theme } = useTheme();

  const headerStyles = {
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
  };

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
          title: 'Appointment',
          ...headerStyles,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          // headerShown: true,
          title: 'Appointment Details',
          headerBackVisible: true,
          ...headerStyles,
        }}
      />
      <Stack.Screen
        name="speciality/index"
        options={{ headerShown: true, title: 'Specialty', ...headerStyles }}
      />
      <Stack.Screen
        name="speciality/[speciality]"
        options={{ headerShown: true, title: 'Doctors', ...headerStyles }}
      />
      <Stack.Screen name="doctor/[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="book"
        options={{
          headerShown: true,
          title: 'My Appointment',
          ...headerStyles,
        }}
      />
      <Stack.Screen
        name="PaymentWebViewScreen"
        options={{
          headerShown: true,
          title: 'Payment Screen',
          ...headerStyles,
        }}
      />
    </Stack>
  );
};

export default AppointmentsPage;
