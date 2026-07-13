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

const Tab = createBottomTabNavigator<PatientTabParamList>();
const Stack = createNativeStackNavigator<PatientStackParamList>();

type TabIconName = 'home' | 'calendar-today' | 'local-pharmacy' | 'settings';

const TAB_CONFIG: Record<string, { icon: TabIconName; label: string }> = {
  Home: { icon: 'home', label: 'Home' },
  Appointment: { icon: 'calendar-today', label: 'Appointment' },
  Pharmacy: { icon: 'local-pharmacy', label: 'Pharmacy' },
  Settings: { icon: 'settings', label: 'Settings' },
};

const PatientTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarShowLabel: false,
      tabBarIcon: ({ focused }) => {
        const cfg = TAB_CONFIG[route.name];
        return (
          <View style={[styles.tabItem, focused && styles.tabItemActive]}>
            <MaterialIcons
              name={cfg.icon}
              size={22}
              color={focused ? colors.text.white : colors.text.medium}
            />
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
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
    <Stack.Screen name="DoctorsBySpeciality" component={DoctorsBySpecialityScreen} />
    <Stack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
    <Stack.Screen
      name="ZoomMeeting"
      component={ZoomMeetingScreen}
      options={{ headerShown: false, gestureEnabled: false }}
    />
  </Stack.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.purple[100],  // Figma: fill=#f1eff8
    borderTopWidth: 0,
    marginTop: -50,
    height: 120,
    paddingBottom: 60,
    elevation: 2,
    shadowOpacity: 0,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 6,
    borderRadius: 10,
    // borderWidth: 1,
    gap: 2,
    minWidth: 70,
    height: 60,
  },
  tabItemActive: {
    backgroundColor: colors.primary[950],  // Figma: fill=#140c5e
  },
  tabLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.text.medium,
  },
  tabLabelActive: {
    color: colors.text.white,
  },
});
