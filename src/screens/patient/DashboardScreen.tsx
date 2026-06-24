import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { PatientStackParamList } from '../../navigation/types';
import { colors, typography, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import {
  ProfileFields,
  AppointmentData,
  apiListProfiles,
  apiGetAppointments,
} from '../../services/api';

const MedicPadiIcon = require('../../../assets/Medicpadi_logo.png');

type Nav = NativeStackNavigationProp<PatientStackParamList>;

interface DashStats {
  doctors: number;
  pharmacies: number;
  labs: number;
  pastAppointments: number;
}

let profileCompletionAlertShown = false;

const formatApptTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { token, profile, user } = useAuth();

  const [doctors, setDoctors] = useState<ProfileFields[]>([]);
  const [upcomingAppt, setUpcomingAppt] = useState<AppointmentData | null>(null);
  const [recentAppts, setRecentAppts] = useState<AppointmentData[]>([]);
  const [stats, setStats] = useState<DashStats>({ doctors: 0, pharmacies: 0, labs: 0, pastAppointments: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!profileCompletionAlertShown && profile && profile.profile?.isProfileComplete === false) {
      profileCompletionAlertShown = true;
      Alert.alert(
        'Complete Your Profile',
        'Your profile is incomplete. Complete it now to get the best experience.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Complete Now', onPress: () => navigation.navigate('EditProfile') },
        ],
      );
    }
  }, [profile]);

  const resolvedUser = user ?? profile?.rest ?? null;
  const greetingName = profile?.profile?.firstName
    ? `${profile.profile.firstName},`
    : resolvedUser?.fullName
    ? `${resolvedUser.fullName.split(' ')[0]},`
    : 'there,';

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [doctorsRes, pharmaRes, labRes, upcomingRes, pastRes] = await Promise.allSettled([
        apiListProfiles({ role: 'consultant', limit: 10 }, token),
        apiListProfiles({ role: 'pharmacy', limit: 1 }, token),
        apiListProfiles({ role: 'lab', limit: 1 }, token),
        apiGetAppointments({ status: 'pending,confirmed', limit: 5 }, token),
        apiGetAppointments({ status: 'completed', limit: 5 }, token),
      ]);

      if (doctorsRes.status === 'fulfilled') {
        const items = Array.isArray(doctorsRes.value.data) ? doctorsRes.value.data : [];
        setDoctors(items);
        setStats((s) => ({ ...s, doctors: doctorsRes.value.total ?? items.length }));
      }
      if (pharmaRes.status === 'fulfilled') {
        setStats((s) => ({ ...s, pharmacies: pharmaRes.value.total ?? 0 }));
      }
      if (labRes.status === 'fulfilled') {
        setStats((s) => ({ ...s, labs: labRes.value.total ?? 0 }));
      }
      if (upcomingRes.status === 'fulfilled') {
        const items = Array.isArray(upcomingRes.value.data) ? upcomingRes.value.data : [];
        setUpcomingAppt(items[0] ?? null);
      }
      if (pastRes.status === 'fulfilled') {
        const items = Array.isArray(pastRes.value.data) ? pastRes.value.data : [];
        setRecentAppts(items.slice(0, 2));
        setStats((s) => ({ ...s, pastAppointments: pastRes.value.total ?? 0 }));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const statCards = [
    { value: String(stats.doctors), label: 'Available Doctors' },
    { value: String(stats.pharmacies), label: 'Available Pharmacy' },
    { value: String(stats.labs), label: 'Available Laboratories' },
    { value: String(stats.pastAppointments), label: 'Past Appointment' },
  ];

  const providerName = (appt: AppointmentData) => {
    if (appt.provider?.firstName) return `Dr. ${appt.provider.firstName} ${appt.provider.lastName ?? ''}`.trim();
    return 'Doctor';
  };

  const providerSpecialty = (appt: AppointmentData) =>
    appt.provider?.speciality ?? '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── Blue banner ── */}
        <View style={styles.banner}>
          <View style={styles.topBar}>
            <View style={styles.logoRow}>
              <Image source={MedicPadiIcon} style={styles.logoImage} />
            </View>
            <View style={styles.topActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('Notifications')}
              >
                <MaterialIcons name="notifications" size={22} color={colors.text.dark} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('Profile')}
              >
                { profile?.profile?.profilePicture?.url ?
                  <Image source={{ uri: profile.profile.profilePicture!.url }} style={styles.avatar} /> :
                  <MaterialIcons name="person" size={22} color={colors.text.dark} />
                }
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.greetingRow}>
            {/* <View style={styles.avatar} /> */}
            <View>
              <Text style={styles.greetingName}>Hello {greetingName}</Text>
              <Text style={styles.greetingSub}>How are you feeling today?</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {statCards.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <View style={styles.statArrow}>
                  <MaterialIcons name="arrow-forward" size={12} color={colors.primary[950]} />
                </View>
                <View>
                  <Text style={styles.statValue}>{loading ? '—' : stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Main content ── */}
        <View style={styles.content}>
          {/* Quick actions */}
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate('Appointment' as any)}
            >
              <View style={styles.quickTop}>
                <Text style={styles.quickCardLabel}>My Appointment</Text>
                <MaterialIcons name="calendar-today" size={20} color={colors.text.primary} />
              </View>
              <View style={styles.quickBtn}>
                <Text style={styles.quickBtnText}>Book</Text>
                <MaterialIcons name="arrow-forward-ios" size={12} color={colors.text.white} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate('MedicalHistory')}
            >
              <View style={styles.quickTop}>
                <Text style={styles.quickCardLabel}>Medical Reports</Text>
                <MaterialIcons name="assignment" size={20} color={colors.text.primary} />
              </View>
              <View style={styles.quickBtn}>
                <Text style={styles.quickBtnText}>View</Text>
                <MaterialIcons name="arrow-forward-ios" size={12} color={colors.text.white} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Upcoming Appointment */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Appointment</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Appointment' as any)}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color={colors.primary[950]} />
            ) : upcomingAppt ? (
              <View style={styles.apptCard}>
                <View style={styles.apptDoctorRow}>
                  <View style={styles.apptDocInfo}>
                    <View style={styles.apptAvatar} />
                    <View>
                      <Text style={styles.apptDocName}>{providerName(upcomingAppt)}</Text>
                      <Text style={styles.apptDocSpec}>{providerSpecialty(upcomingAppt)}</Text>
                    </View>
                  </View>
                  <View style={styles.chatBtn}>
                    <MaterialIcons name="chat" size={18} color={colors.text.dark} />
                  </View>
                </View>

                <View style={styles.apptMetaRow}>
                  <View style={styles.apptMetaBox}>
                    <Text style={styles.apptMetaLabel}>Date & Time</Text>
                    <Text style={styles.apptMetaValue}>
                      {formatApptTime(upcomingAppt.appointment_time)}
                    </Text>
                  </View>
                  <View style={styles.apptMetaSep} />
                  <View style={styles.apptMetaBox}>
                    <Text style={styles.apptMetaLabel}>Status</Text>
                    <Text style={styles.apptMetaValue}>{upcomingAppt.status}</Text>
                  </View>
                </View>

                <View style={styles.apptBtnRow}>
                  <TouchableOpacity
                    style={styles.apptBtnPrimary}
                    onPress={() =>
                      navigation.navigate('BookAppointment', {
                        providerId: upcomingAppt.provider_id,
                        doctorName: providerName(upcomingAppt),
                      })
                    }
                  >
                    <Text style={styles.apptBtnPrimaryText}>Re-schedule</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.apptBtnOutline}>
                    <Text style={styles.apptBtnOutlineText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No upcoming appointments</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('BookAppointment', {})}
                >
                  <Text style={styles.emptyLink}>Book one now →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Available Doctors */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Doctors</Text>
            {loading ? (
              <ActivityIndicator color={colors.primary[950]} />
            ) : doctors.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.doctorsScroll}>
                {doctors.map((doc) => (
                  <TouchableOpacity
                    key={doc.id ?? doc.user_id}
                    style={styles.docCard}
                    onPress={() =>
                      navigation.navigate('BookAppointment', {
                        doctorName: `Dr. ${doc.firstName ?? ''} ${doc.lastName ?? ''}`.trim(),
                        providerId: doc.user_id,
                      })
                    }
                  >
                    <View style={styles.docImage} />
                    <View style={styles.docInfo}>
                      <Text style={styles.docName}>
                        Dr. {doc.firstName ?? ''} {doc.lastName ?? ''}
                      </Text>
                      <Text style={styles.docSpecialty} numberOfLines={1}>
                        {doc.speciality ?? 'General Practitioner'}
                      </Text>
                      <View style={styles.docRatingRow}>
                        <MaterialIcons name="star" size={12} color="#f98007" />
                        <Text style={styles.docRating}>{doc.rating?.toFixed(1) ?? '—'}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>No doctors available</Text>
            )}
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentAppts.length === 0 && !loading ? (
              <Text style={styles.emptyText}>No recent activity</Text>
            ) : (
              recentAppts.map((appt) => (
                <View key={appt.id} style={styles.activityCard}>
                  <View style={styles.activityIconBox}>
                    <MaterialIcons name="calendar-today" size={20} color={colors.text.dark} />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>Appointment completed</Text>
                    <Text style={styles.activitySub}>
                      {providerName(appt)} · {formatApptTime(appt.appointment_time)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  banner: {
    backgroundColor: colors.primary[200],
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
    marginTop: spacing.xs,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: { width: 60, height: 60 },
  logoText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.sm,
    color: colors.primary[950],
    letterSpacing: 1,
  },
  topActions: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.text.dark },
  greetingName: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.lg,
    color: colors.text.dark,
  },
  greetingSub: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.medium,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: {
    width: '48%',
    backgroundColor: colors.primary[900],
    borderRadius: radius.lg,
    padding: spacing.base,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  statArrow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary[200],
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  statValue: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.lg,
    color: colors.text.white,
  },
  statLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: '#e7e7e7',
  },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.base },
  quickRow: { flexDirection: 'row', gap: spacing.base, marginBottom: spacing.xl },
  quickCard: {
    flex: 1,
    backgroundColor: colors.cardLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  quickTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quickCardLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.medium,
    flex: 1,
    marginRight: spacing.xs,
  },
  quickBtn: {
    backgroundColor: colors.primary[950],
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'stretch',
    justifyContent: 'center',
    height: 40,
  },
  quickBtnText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.white,
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
    color: colors.text.medium,
    marginBottom: spacing.md,
  },
  viewAll: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.medium,
  },
  apptCard: {
    backgroundColor: colors.cardBlue,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.md,
  },
  apptDoctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  apptDocInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  apptAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  apptDocName: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
  },
  apptDocSpec: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  chatBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptMetaRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  apptMetaBox: { flex: 1, gap: 2 },
  apptMetaSep: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  apptMetaLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.text.light,
  },
  apptMetaValue: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
  },
  apptBtnRow: { flexDirection: 'row', gap: spacing.md },
  apptBtnPrimary: {
    flex: 1,
    height: 40,
    backgroundColor: colors.primary[950],
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptBtnPrimaryText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.white,
  },
  apptBtnOutline: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary[950],
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptBtnOutlineText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.primary[950],
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.text.light,
    textAlign: 'center',
  },
  emptyLink: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.primary[800],
  },
  doctorsScroll: {
    marginLeft: -spacing.base,
    paddingLeft: spacing.base,
  },
  docCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardBlue,
    borderRadius: radius.lg,
    width: 270,
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  docImage: { width: 100, backgroundColor: colors.text.dark },
  docInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  docName: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
  },
  docSpecialty: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  docRatingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  docRating: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  activityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: { flex: 1 },
  activityTitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  activitySub: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.text.light,
  },
});
