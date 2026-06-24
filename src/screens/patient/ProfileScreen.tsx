import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../navigation/types';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { colors, typography, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { apiGetAppointments } from '../../services/api';

type Nav = NativeStackNavigationProp<PatientStackParamList>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const rootNav = useNavigation<any>();
  const { profile, user, token, logout, refreshProfile } = useAuth();
  const [apptCount, setApptCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'personal' | 'reports'>('personal')

  useEffect(() => {
    if (!token) return;
    apiGetAppointments({ limit: 1 }, token)
      .then((res) => setApptCount(res.total ?? 0))
      .catch(() => setApptCount(null));
  }, [token]);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          await logout();
          rootNav.reset({ index: 0, routes: [{ name: 'Auth' }] });
        },
      },
    ]);
  };

  const resolvedUser = user ?? profile?.rest ?? null;
  const p = profile?.profile;

  const displayName =
    p?.firstName
      ? `${p.firstName} ${p.lastName ?? ''}`.trim()
      : resolvedUser?.fullName ?? resolvedUser?.email ?? 'User';

  const personalInfo = [
    { label: 'Name', value: displayName },
    { label: 'Email Address', value: resolvedUser?.email ?? '—' },
    { label: 'Phone Number', value: p?.phoneNumber ?? '—' },
    { label: 'Gender', value: p?.gender ?? '—' },
    { label: 'Blood Group', value: p?.bloodGroup ?? '—' },
    { label: 'Genotype', value: p?.genotype ?? '—' },
  ];

  const nok = p?.nextOfKin ?? null;
  const nokInfo = nok
    ? [
        { label: 'Name', value: nok.name ?? '—' },
        { label: 'Phone', value: nok.phone ?? '—' },
        { label: 'Email', value: nok.email ?? '—' },
        { label: 'Relationship', value: nok.relationship ?? '—' },
      ]
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="My Profile"
        rightElement={
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
            <MaterialIcons name="edit" size={20} color={colors.primary[800]} />
          </TouchableOpacity>
        }
      />
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary[950]} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Profile header */}
          <View style={styles.profileCard}>
            <View style={styles.avatarWrapper}>
              {p?.profilePicture?.url ? (
                <Image source={{ uri: p.profilePicture.url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar} />
              )}
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Role</Text>
                <Text style={styles.statValue}>{resolvedUser?.role ?? profile?.rest?.role ?? 'patient'}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Appointments</Text>
                <Text style={styles.statValue}>{apptCount ?? '—'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <Button label="Refresh" variant="ghost" onPress={refreshProfile} size="sm" />
            </View>
            {personalInfo.map((item) => (
              <View key={item.label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            ))}
          </View>
          {nokInfo.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Emergency Contact</Text>
              {nokInfo.map((item) => (
                <View key={item.label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => navigation.navigate('MedicalHistory')}
            >
              <Text style={styles.linkText}>Medical History</Text>
              <Text style={styles.linkArrow}>{'>'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkRow}>
              <Text style={styles.linkText}>Help & Support</Text>
              <Text style={styles.linkArrow}>{'>'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkRow} onPress={handleLogout}>
              <Text style={[styles.linkText, { color: colors.danger }]}>Log Out</Text>
              <Text style={styles.linkArrow}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.base, paddingBottom: 40 },
  profileCard: {
    backgroundColor: colors.cardLight,
    borderRadius: radius.lg,
    padding: spacing.base,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarWrapper: { marginBottom: spacing.md },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.text.dark,
    borderWidth: 3,
    borderColor: colors.background,
  },
  name: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.lg,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  statsRow: { flexDirection: 'row', gap: spacing.base },
  statItem: {
    backgroundColor: colors.cardLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    minWidth: 100,
  },
  statLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
  },
  statValue: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.primary[800],
  },
  section: { marginBottom: spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.light,
    flex: 1,
  },
  infoValue: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
    flex: 1,
    textAlign: 'right',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  linkText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
  },
  linkArrow: { color: colors.text.muted, fontSize: 16 },
});
