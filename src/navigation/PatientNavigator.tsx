import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PatientTabParamList, PatientStackParamList } from './types';
import { colors, typography } from '../theme';

import { DashboardScreen } from '../screens/patient/DashboardScreen';
import { AppointmentsScreen } from '../screens/patient/AppointmentsScreen';
import { PharmacyScreen } from '../screens/patient/PharmacyScreen';
import { SettingsScreen } from '../screens/patient/SettingsScreen';
import { BookAppointmentScreen } from '../screens/patient/BookAppointmentScreen';
import { MedicalHistoryScreen } from '../screens/patient/MedicalHistoryScreen';
import { ProfileScreen } from '../screens/patient/ProfileScreen';
import { DrugDetailsScreen } from '../screens/patient/DrugDetailsScreen';
import { LabTestScreen } from '../screens/patient/LabTestScreen';
import { NotificationsScreen } from '../screens/patient/NotificationsScreen';
import { EditProfileScreen } from '../screens/patient/EditProfileScreen';
import { VerifyEmailScreen } from '../screens/patient/VerifyEmailScreen';
import { DoctorProfileScreen } from '../screens/patient/DoctorProfileScreen';
import { SpecialityScreen } from '../screens/patient/SpecialityScreen';
import { DoctorsBySpecialityScreen } from '../screens/patient/DoctorsBySpecialityScreen';
import { BookingDetailsScreen } from '../screens/patient/BookingDetailsScreen';
import { PaymentWebViewScreen } from '../screens/patient/PaymentWebViewScreen';
import { ZoomMeetingScreen } from '../screens/patient/ZoomMeetingScreen';
import { CompleteAppointmentScreen } from '../screens/patient/CompleteAppointmentScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutAnimation } from 'react-native';

const Tab = createBottomTabNavigator<PatientTabParamList>();
const Stack = createNativeStackNavigator<PatientStackParamList>();

type TabIconName = 'home' | 'calendar-today' | 'local-pharmacy' | 'settings';

const TAB_CONFIG: Record<string, { icon: TabIconName; label: string }> = {
  Home: { icon: 'home', label: 'Home' },
  Appointment: { icon: 'calendar-today', label: 'Appointment' },
  Pharmacy: { icon: 'local-pharmacy', label: 'Pharmacy' },
  Settings: { icon: 'settings', label: 'Settings' },
};

const PatientTabs = () => {
  const insets = useSafeAreaInsets();

  const bottomOffset = Math.max(insets.bottom, 12) + 12;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarStyle: [
          styles.tabBar,
          { bottom: bottomOffset },
          bottomOffset >= 30 && {
            height: 72,
            paddingVertical: 2,
          },
        ],
        tabBarShowLabel: false,

        tabBarItemStyle: {
          flex: 1,
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        },

        tabBarIconStyle: {
          width: '100%',
          height: '100%',
          margin: 0,
        },

        tabBarIcon: ({ focused }) => {
          const cfg = TAB_CONFIG[route.name];

          return (
            <View
              style={[
                styles.tabItem,
                focused && styles.tabItemActive,
                bottomOffset >= 30 && {
                  position: 'absolute',
                  height: 60,
                  borderRadius: 30,
                  marginBottom: -48,
                },
              ]}
            >
              <MaterialIcons
                name={cfg.icon}
                size={22}
                color={focused ? colors.text.white : colors.text.medium}
              />

              <Text
                style={[styles.tabLabel, focused && styles.tabLabelActive]}
                numberOfLines={1}
              >
                {cfg.label}
              </Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Appointment" component={AppointmentsScreen} />
      <Tab.Screen name="Pharmacy" component={PharmacyScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export const PatientNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PatientTabs" component={PatientTabs} />
    <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
    <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
    <Stack.Screen name="MedicalHistory" component={MedicalHistoryScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="DrugDetails" component={DrugDetailsScreen} />
    <Stack.Screen name="LabTest" component={LabTestScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="DoctorDetails" component={DoctorProfileScreen} />
    <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    <Stack.Screen name="Speciality" component={SpecialityScreen} />
    <Stack.Screen
      name="DoctorsBySpeciality"
      component={DoctorsBySpecialityScreen}
    />
    <Stack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
    <Stack.Screen
      name="CompleteAppointment"
      component={CompleteAppointmentScreen}
    />
    <Stack.Screen
      name="ZoomMeeting"
      component={ZoomMeetingScreen}
      options={{ headerShown: false, gestureEnabled: false }}
    />
  </Stack.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    position: 'relative',
    left: 20,
    right: 20,

    borderRadius: 36,

    backgroundColor: colors.purple[100],
    borderWidth: 1,
    borderColor: colors.purple[300],

    paddingHorizontal: 8,
    paddingVertical: 8,

    elevation: 8,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },

  tabItem: {
    width: '100%',
    height: '100%',

    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: -10,
    // paddingVertical: 4,
    borderRadius: 28,
    gap: 4,
  },

  tabItemActive: {
    backgroundColor: colors.primary[950],
  },

  tabLabel: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xs,
    color: colors.text.medium,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  tabLabelActive: {
    color: colors.text.white,
  },
});
