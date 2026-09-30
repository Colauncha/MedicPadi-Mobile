import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
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
import { apiSendVerificationEmail } from '../../services/api';

type Nav = NativeStackNavigationProp<PatientStackParamList>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { profile, user, token, logout, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          await logout();
        },
      },
    ]);
  };

  const resolvedUser = user ?? profile?.rest ?? null;
  const p = profile?.profile;
  const isVerified = resolvedUser?.isEmailVerified ?? true;

  const handleSendVerification = async () => {
    if (!token) return;
    setSendingVerification(true);
    try {
      await apiSendVerificationEmail(token);
      Alert.alert(
        'Code sent',
        `A verification code has been sent to ${resolvedUser?.email ?? 'your email'}.`,
        [{ text: 'Enter Code', onPress: () => navigation.navigate('VerifyEmail') }],
      );
    } catch (e: any) {
      Alert.alert('Failed', e?.message ?? 'Could not send verification email. Try again.');
    } finally {
      setSendingVerification(false);
    }
  };

  const displayName =
    p?.firstName
      ? `${p.firstName} ${p.lastName ?? ''}`.trim()
      : resolvedUser?.fullName ?? resolvedUser?.email ?? 'User';

  const calcAge = (dob?: string): number | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    return Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };
  const age = calcAge(p?.dateOfBirth);
  const ageDisplay = age !== null ? `${age}yrs` : '—';
  const weightDisplay = p?.weight ? `${p.weight}kg` : '—';
  const heightDisplay = p?.height ? `${p.height}cm` : '—';

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
        <ScrollView 
          contentContainerStyle={styles.scroll} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshProfile} />}
        >
          {/* Profile header */}
          <View style={styles.profileCardWrapper}>
            <View style={styles.profileCard}>
              <Text style={styles.name}>{displayName}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Age</Text>
                  <Text style={styles.statValue}>{ageDisplay}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Weight</Text>
                  <Text style={styles.statValue}>{weightDisplay}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Height</Text>
                  <Text style={styles.statValue}>{heightDisplay}</Text>
                </View>
              </View>
            </View>
            <View style={styles.avatarWrapper}>
              {p?.profilePicture?.url ? (
                <Image source={{ uri: p.profilePicture.url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar} />
              )}
            </View>
          </View>
          {!isVerified && (
            <TouchableOpacity
              style={styles.verifyBanner}
              onPress={handleSendVerification}
              disabled={sendingVerification}
              activeOpacity={0.8}
            >
              <MaterialIcons name="mark-email-unread" size={20} color={colors.warning} />
              <View style={styles.verifyBannerText}>
                <Text style={styles.verifyBannerTitle}>Email not verified</Text>
                <Text style={styles.verifyBannerSub}>Tap to send a verification code</Text>
              </View>
              {sendingVerification
                ? <ActivityIndicator size="small" color={colors.warning} />
                : <MaterialIcons name="chevron-right" size={20} color={colors.warning} />
              }
            </TouchableOpacity>
          )}

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
  profileCardWrapper: {
    position: 'relative',
    marginTop: 44,
    marginBottom: spacing.xl,
  },
  profileCard: {
    backgroundColor: colors.cardLight,
    borderRadius: radius.lg,
    paddingTop: 44 + spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'absolute',
    top: -44,
    alignSelf: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.text.dark,
    borderWidth: 4,
    borderColor: colors.background,
  },
  name: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.lg,
    color: colors.text.dark,
    marginBottom: spacing.base,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  statLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.base,
    color: colors.primary[700],
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
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#fff8ee',
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  verifyBannerText: { flex: 1 },
  verifyBannerTitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.base,
    color: colors.warning,
  },
  verifyBannerSub: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
});
