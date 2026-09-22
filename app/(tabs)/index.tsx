import { Image } from 'expo-image';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  AppointmentCard,
  AppointmentRequestRow,
} from '@/components/appointmentCards/AppointmentCards';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  apiGetAppointments,
  apiGetDoctorStats,
  apiListProfiles,
  AppointmentData,
  AuthUser,
  DoctorStatsResponse,
  ProfileData,
  ProfileFields,
} from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';
import { Theme } from '@/theme/types';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';

const MedicpadiLogo = require('../../assets/images/medicpadi-logo.png');

// ---------- Header ----------

const DashboardHeaderElement = ({
  user,
  profile,
  stats,
  appTheme,
}: {
  user: AuthUser | null;
  profile: ProfileData | null;
  stats: DoctorStatsResponse | null;
  appTheme: Theme;
}) => {
  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      header: {
        paddingTop: 20,
        paddingHorizontal: 20,
      },
      logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      logoRowImage: {
        width: 100,
        height: 90,
        position: 'relative',
        left: -10,
      },
      logoRowIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      },
      icons: {
        padding: 4,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.mono.light,
        height: 32,
        width: 32,
      },
      welcomeRow: {
        paddingHorizontal: 5,
      },
      welcomeText: {
        color: theme.colors.mono.dark,
        fontSize: theme.typography.sizes.lg,
      },
      welcomeSubText: {
        color: theme.colors.mono.dark,
        fontSize: theme.typography.sizes.md,
        fontWeight: '200',
      },
      statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.lg,
      },
      statCard: {
        width: '48%',
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surfaceCardBlue,
        alignItems: 'flex-start',
        position: 'relative',
      },
      statValue: {
        color: theme.colors.mono.light,
        fontSize: theme.typography.sizes.xl,
        paddingTop: theme.spacing.xxl + 20,
      },
      statLabel: {
        color: theme.colors.mono.light,
        fontFamily: theme.typography.fonts?.rounded,
        fontSize: theme.typography.sizes.sm,
        fontWeight: '200',
        marginBottom: theme.spacing.lg,
      },
    })
  );

  const statCards = [
    {
      value: String(stats?.totalPatients || '0'),
      label: 'Total Patients',
      icon: 'arrow.up.right',
      to: '/patients',
    },
    {
      value: `${String(stats?.returningPatientPercent || '0')} `,
      label: 'Active Patients (%)',
      icon: 'arrow.up.right',
      to: '/patients',
    },
    {
      value: String(stats?.totalAppointments || '0'),
      label: 'Appointments',
      icon: 'arrow.up.right',
      to: '/appointments',
    },
    {
      value: `${String(profile?.profile.rating || '0.0')}`,
      label: 'Rating',
      icon: 'arrow.up.right',
      to: '/profile',
    },
  ];

  return (
    <View style={styles.header}>
      <View style={styles.logoRow}>
        <Image
          source={MedicpadiLogo}
          style={styles.logoRowImage}
          contentFit="contain"
        />
        <View style={styles.logoRowIcons}>
          <IconSymbol
            name="magnifyingglass"
            size={24}
            style={styles.icons}
            color={appTheme.colors.mono.darkGray}
          />
          <IconSymbol
            name="bell.badge.fill"
            size={24}
            style={styles.icons}
            color={appTheme.colors.mono.darkGray}
          />
          {profile?.profile.profilePicture?.url ? (
            <Pressable onPress={() => router.push('/profile')}>
              <Image
                source={{ uri: profile.profile.profilePicture.url }}
                style={styles.icons}
                contentFit="cover"
              />
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push('/profile')}>
              <IconSymbol
                name="person.fill"
                size={24}
                style={styles.icons}
                color={appTheme.colors.mono.darkGray}
              />
            </Pressable>
          )}
        </View>
      </View>
      <View style={styles.welcomeRow}>
        <ThemedText style={styles.welcomeText} type="defaultSemiBold">
          Hello Dr. {profile?.profile.firstName || user?.fullName || 'User'}
        </ThemedText>
        <ThemedText style={styles.welcomeSubText} type="subtitle">
          Ready to manage your patients today?
        </ThemedText>
      </View>
      <View style={styles.statsGrid}>
        {statCards.map((card, index) => (
          <TouchableOpacity
            onPress={() => router.push(card.to as any)}
            key={index}
            style={styles.statCard}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.statValue} type="title">
              {card.value}
              {card.label === 'Rating' ? (
                <Text
                  style={{
                    fontSize: appTheme.typography.sizes.md,
                    color: appTheme.colors.textMuted,
                  }}
                >
                  /5
                </Text>
              ) : card.label === 'Active Patients (%)' ? (
                <Text
                  style={{
                    fontSize: appTheme.typography.sizes.md,
                    color: appTheme.colors.textMuted,
                  }}
                >
                  %
                </Text>
              ) : (
                ''
              )}
            </ThemedText>
            <ThemedText style={styles.statLabel} type="subtitle">
              {card.label}
            </ThemedText>
            <IconSymbol
              name={card.icon as any}
              size={20}
              style={{ marginTop: 10, position: 'absolute', top: 2, right: 10 }}
              color={appTheme.colors.mono.light}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ---------- Main screen ----------

export default function HomeScreen() {
  const { user, profile, token } = useAuth();
  const { theme: appTheme } = useTheme();
  const [stats, setStats] = useState<DoctorStatsResponse | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<AppointmentData[]>(
    []
  );
  const [appointmentRequests, setAppointmentRequests] = useState<
    AppointmentData[]
  >([]);
  const [patientsById, setPatientsById] = useState<
    Map<string | undefined, ProfileFields>
  >(new Map());
  const [todaysAppointmentsLen, setTodaysAppointmentsLen] = useState<number>(0);
  const [appointmentReqLen, setAppointmentReqLen] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [apiRun, setApiRun] = useState(false);

  const fetchStatsNAppointments = useCallback(async () => {
    if (!token) return;
    try {
      const [statsResp, todaysAppointmentsResp, appointmentRequestsResp] =
        await Promise.all([
          apiGetDoctorStats(token),
          apiGetAppointments(
            {
              appointmentTime: new Date().toISOString().split('T')[0],
              id: user?.id || '',
            },
            token
          ),
          apiGetAppointments({ status: 'pending', id: user?.id || '' }, token),
        ]);

      setStats(statsResp);
      setTodayAppointments(todaysAppointmentsResp.data);
      setAppointmentRequests(appointmentRequestsResp.data);
      setTodaysAppointmentsLen(todaysAppointmentsResp.meta.total);
      setAppointmentReqLen(appointmentRequestsResp.meta.total);

      // Collect unique patient IDs from both lists
      const patientIds = Array.from(
        new Set(
          [...todaysAppointmentsResp.data, ...appointmentRequestsResp.data].map(
            (a) => a.patient_id
          )
        )
      );

      if (patientIds.length > 0) {
        const params = {
          ids: patientIds.length > 1 ? patientIds : [],
          id: patientIds.length === 1 ? patientIds[0] : undefined,
        };
        const patients = await apiListProfiles(params, token);
        setPatientsById(
          new Map(patients.data.map((p: ProfileFields) => [p.id, p]))
        );
      } else {
        setPatientsById(new Map());
      }
    } catch (error) {
      console.error('Error fetching doctor stats:', error);
    } finally {
      setApiRun(true);
    }
  }, [token, user]);

  if (!apiRun) {
    fetchStatsNAppointments();
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStatsNAppointments();
    setRefreshing(false);
  }, [fetchStatsNAppointments]);

  const handleAccept = useCallback(async (appointmentId: string) => {
    // TODO: call your accept-appointment API endpoint here
    // await apiUpdateAppointmentStatus(appointmentId, 'confirmed', token);
    setAppointmentRequests((prev: AppointmentData[]) =>
      prev.filter((a) => a.id !== appointmentId)
    );
    setAppointmentReqLen((prev) => Math.max(0, prev - 1));
  }, []);

  const handleDecline = useCallback(async (appointmentId: string) => {
    // TODO: call your decline-appointment API endpoint here
    // await apiUpdateAppointmentStatus(appointmentId, 'cancelled', token);
    setAppointmentRequests((prev: AppointmentData[]) =>
      prev.filter((a) => a.id !== appointmentId)
    );
    setAppointmentReqLen((prev) => Math.max(0, prev - 1));
  }, []);

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      scroll: {
        flex: 1,
        padding: theme.spacing.base,
        alignItems: 'center',
        paddingBottom: theme.spacing.xxl + 20,
      },
      content: {
        flexGrow: 1,
        width: '100%',
        backgroundColor: theme.colors.surfaceCardLight,
        padding: theme.spacing.base,
        marginBottom: theme.spacing.base,
        // borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        marginHorizontal: theme.spacing.base,
        // boxShadow: theme.shadows.heavy,
      },
      titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: theme.spacing.xs,
        borderBottomWidth: 1,
        borderColor: theme.colors.border,
      },
      title: {
        fontSize: theme.typography.sizes.base,
        color: theme.colors.text,
      },
      viewAll: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.purple.extraDeep,
      },
      todaysApp: {
        paddingVertical: theme.spacing.lg,
      },
      appointmentsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      },
      emptyText: {
        color: theme.colors.textMuted,
        fontSize: theme.typography.sizes.sm,
      },
    })
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{
        light: appTheme.colors.blue.bg,
        dark: appTheme.colors.blue.bg,
      }}
      headerElement={DashboardHeaderElement({ user, profile, stats, appTheme })}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              Today&apos;s Patient{' '}
              <Text
                style={{
                  fontSize: appTheme.typography.sizes.sm,
                  color: appTheme.colors.textMuted,
                }}
              >
                ({todaysAppointmentsLen})
              </Text>
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/appointments' as any)}
            >
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {todayAppointments.length > 0 ? (
            <View style={[styles.todaysApp, styles.appointmentsGrid]}>
              {todayAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  patient={patientsById.get(appointment.patient_id)}
                  theme={appTheme}
                />
              ))}
            </View>
          ) : (
            <View style={styles.todaysApp}>
              <Text style={styles.emptyText}>
                There are no appointments scheduled for today
              </Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              Appointment Request{' '}
              <Text
                style={{
                  fontSize: appTheme.typography.sizes.sm,
                  color: appTheme.colors.textMuted,
                }}
              >
                ({appointmentReqLen})
              </Text>
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/appointments',
                  params: { status: 'request' },
                })
              }
            >
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {appointmentRequests.length > 0 ? (
            <View>
              {appointmentRequests.map((appointment) => (
                <AppointmentRequestRow
                  key={appointment.id}
                  appointment={appointment}
                  patient={patientsById.get(appointment.patient_id)}
                  theme={appTheme}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              ))}
            </View>
          ) : (
            <View style={styles.todaysApp}>
              <Text style={styles.emptyText}>
                No pending appointment requests
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ParallaxScrollView>
  );
}
