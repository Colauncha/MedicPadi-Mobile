import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../navigation/types';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type Nav = NativeStackNavigationProp<PatientStackParamList>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [notifications, setNotifications] = React.useState(true);
  const [biometrics, setBiometrics] = React.useState(false);
  const { profile } = useAuth()

  const rows: Array<{
    icon: IconName;
    label: string;
    onPress?: () => void;
    toggle?: { value: boolean; onToggle: (v: boolean) => void };
  }> = [
    { icon: 'person', label: 'My Profile', onPress: () => navigation.navigate('Profile') },
    { icon: 'history', label: 'Medical History', onPress: () => navigation.navigate('MedicalHistory') },
    { icon: 'notifications', label: 'Push Notifications', toggle: { value: notifications, onToggle: setNotifications } },
    { icon: 'fingerprint', label: 'Biometric Login', toggle: { value: biometrics, onToggle: setBiometrics } },
    { icon: 'credit-card', label: 'Payment Methods', onPress: () => {} },
    { icon: 'lock', label: 'Privacy & Security', onPress: () => {} },
    { icon: 'help-outline', label: 'Help & Support', onPress: () => {} },
    { icon: 'description', label: 'Terms & Conditions', onPress: () => {} },
    { icon: 'star-outline', label: 'Rate the App', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('Profile')}>
        <Image source={{ uri: profile?.profile.profilePicture?.url }}  style={styles.avatar} />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.profile.firstName}  {profile?.profile.lastName}</Text>
          <Text style={styles.profileEmail}>{profile?.rest?.email}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={colors.text.muted} />
      </TouchableOpacity>
      <ScrollView style={styles.scroll}>
        {rows.map((row) => (
          <TouchableOpacity
            key={row.label}
            style={styles.row}
            onPress={row.onPress}
            disabled={!!row.toggle}
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconBox}>
                <MaterialIcons name={row.icon} size={20} color={colors.primary[800]} />
              </View>
              <Text style={styles.rowLabel}>{row.label}</Text>
            </View>
            {row.toggle ? (
              <Switch
                value={row.toggle.value}
                onValueChange={row.toggle.onToggle}
                trackColor={{ false: colors.border, true: colors.primary[800] }}
                thumbColor={colors.background}
              />
            ) : (
              <MaterialIcons name="chevron-right" size={22} color={colors.text.muted} />
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.logoutRow}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.lg,
    color: colors.text.dark,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.cardLight,
    marginHorizontal: spacing.base,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.text.dark,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
  },
  profileEmail: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  scroll: { paddingHorizontal: spacing.base, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
  },
  logoutRow: {
    marginTop: spacing.xl,
    alignItems: 'center',
    padding: spacing.base,
  },
  logoutText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.base,
    color: colors.danger,
  },
});
