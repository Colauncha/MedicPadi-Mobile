import { Tabs } from 'expo-router';

import HapticTab from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { Image } from 'expo-image';

// export const unstable_settings = {
//   initialRouteName: 'index',
//   anchor: '(tabs)',
// };

export default function TabLayout() {
  const { theme } = useTheme();
  const { profile } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary.deep,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          position: 'absolute',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          fontFamily: theme.typography.fonts?.rounded,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="calendar.badge.plus" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.2.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) =>
            profile?.profile.profilePicture?.url ? (
              <Image
                source={profile?.profile.profilePicture?.url}
                style={{ width: 28, height: 28, borderRadius: 14 }}
              />
            ) : (
              <IconSymbol size={28} name="person.fill" color={color} />
            ),
        }}
      />
    </Tabs>
  );
}
