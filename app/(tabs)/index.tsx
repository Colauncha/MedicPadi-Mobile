import { Image } from 'expo-image';
import { Href, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AvatarFromString from '@/components/avatar';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  apiGetAppointments,
  apiGetProfileById,
  apiListProfiles,
  AppointmentData,
  AuthUser,
  ProfileData,
  ProfileFields,
} from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';
import { Theme } from '@/theme/types';

const MedicpadiLogo = require('../../assets/images/medicpadi-logo.png');
const QuickImage = require('../../assets/images/DashboardRectQuickActions.png');

interface DashStats {
  doctors: number;
  pharmacies: number;
  labs: number;
  pastAppointments: number;
}

let emailVerificationAlertShown = false;
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

const providerName = (provider?: ProfileData | null) => {
  if (provider?.profile?.firstName)
    return `Dr. ${provider.profile.firstName} ${provider.profile.lastName ?? ''}`.trim();
  return 'Doctor';
};

const shortBio = (bio: string | undefined, fallback: string) =>
  bio ? (bio.length > 20 ? bio.slice(0, 20) + '…' : bio) : fallback;

// ---------- Header ----------

const DashboardHeaderElement = ({
  user,
  profile,
  stats,
  loading,
  appTheme,
}: {
  user: AuthUser | null;
  profile: ProfileData | null;
  stats: DashStats;
  loading: boolean;
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
        alignItems: 'center',
        justifyContent: 'space-between',
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

  const resolvedUser = user ?? profile?.rest ?? null;
  const greetingName = profile?.profile?.firstName
    ? profile.profile.firstName
    : resolvedUser?.fullName
      ? resolvedUser.fullName.split(' ')[0]
      : 'there';

  const statCards: { value: number; label: string; to: Href }[] = [
    {
      value: stats.doctors,
      label: 'Available Doctors',
      to: '/appointments/speciality',
    },
    { value: stats.pharmacies, label: 'Available Pharmacy', to: '/pharmacy' },
    { value: stats.labs, label: 'Available Laboratories', to: '/lab' },
    {
      value: stats.pastAppointments,
      label: 'Past Appointment',
      to: '/appointments',
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
          <Pressable onPress={() => router.push('/notifications')}>
            <IconSymbol
              name="bell.fill"
              size={24}
              style={styles.icons}
              color={appTheme.colors.mono.darkGray}
            />
          </Pressable>
          <Pressable onPress={() => router.push('/profile')}>
            {profile?.profile.profilePicture?.url ? (
              <Image
                source={{ uri: profile.profile.profilePicture.url }}
                style={styles.icons}
                contentFit="cover"
              />
            ) : (
              <IconSymbol
                name="person.fill"
                size={24}
                style={styles.icons}
                color={appTheme.colors.mono.darkGray}
              />
            )}
          </Pressable>
        </View>
      </View>
      <View style={styles.welcomeRow}>
        <ThemedText style={styles.welcomeText} type="defaultSemiBold">
          Hello {greetingName},
        </ThemedText>
        <ThemedText style={styles.welcomeSubText} type="subtitle">
          How are you feeling today?
        </ThemedText>
      </View>
      <View style={styles.statsGrid}>
        {statCards.map((card) => (
          <TouchableOpacity
            onPress={() => router.push(card.to)}
            key={card.label}
            style={styles.statCard}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.statValue} type="title">
              {loading ? '—' : String(card.value)}
            </ThemedText>
            <ThemedText style={styles.statLabel} type="subtitle">
              {card.label}
            </ThemedText>
            <IconSymbol
              name="arrow.up.right"
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

// ---------- Provider card ----------

const ProviderCard = ({
  name,
  subtitle,
  rating,
  pictureUrl,
  appTheme,
  onPress,
}: {
  name: string;
  subtitle: string;
  rating?: number;
  pictureUrl?: string;
  appTheme: Theme;
  onPress: () => void;
}) => {
  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      card: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceCardLight,
        borderRadius: theme.radius.lg,
        width: 240,
        marginRight: theme.spacing.md,
        overflow: 'hidden',
        padding: theme.spacing.md
      },
      image: { width: 80, height: 80, borderRadius: theme.radius.full },
      info: {
        flex: 1,
        padding: theme.spacing.md,
        justifyContent: 'center',
        gap: theme.spacing.xs,
      },
      name: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '500',
        color: theme.colors.text,
      },
      subtitle: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        textTransform: 'capitalize',
      },
      ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
      },
      rating: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '500',
        color: theme.colors.text,
      },
    })
  );

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {pictureUrl ? (
        <Image
          source={{ uri: pictureUrl }}
          style={styles.image}
          contentFit="cover"
        />
      ) : (
        <AvatarFromString input={name} size={80} />
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
        <View style={styles.ratingRow}>
          <IconSymbol
            name="star.fill"
            size={12}
            color={appTheme.colors.primary.deep}
          />
          <Text style={styles.rating}>{rating ?? 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ---------- Main screen ----------

export default function HomeScreen() {
  const { user, profile, token } = useAuth();
  const { theme: appTheme } = useTheme();

  const [doctors, setDoctors] = useState<ProfileFields[]>([]);
  const [pharma, setPharma] = useState<ProfileFields[]>([]);
  const [labs, setLabs] = useState<ProfileFields[]>([]);
  const [upcomingAppt, setUpcomingAppt] = useState<AppointmentData | null>(
    null
  );
  const [recentAppts, setRecentAppts] = useState<AppointmentData[]>([]);
  const [providersById, setProvidersById] = useState<Map<string, ProfileData>>(
    new Map()
  );
  const [stats, setStats] = useState<DashStats>({
    doctors: 0,
    pharmacies: 0,
    labs: 0,
    pastAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const isVerified = profile.rest?.isEmailVerified ?? user?.isEmailVerified;
    const isComplete = profile.profile?.isProfileComplete;

    if (!emailVerificationAlertShown && isVerified === false) {
      emailVerificationAlertShown = true;
      Alert.alert(
        'Verify Your Email',
        'Please verify your email address to access all features.',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Verify Now',
            onPress: () => router.push('/verifyEmail'),
          },
        ]
      );
    } else if (!profileCompletionAlertShown && isComplete === false) {
      profileCompletionAlertShown = true;
      Alert.alert(
        'Complete Your Profile',
        'Your profile is incomplete. Complete it now to get the best experience.',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Complete Now',
            onPress: () => router.push('/editProfile'),
          },
        ]
      );
    }
  }, [profile, user]);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [doctorsRes, pharmaRes, labRes, pendingRes, confirmedRes, pastRes] =
        await Promise.allSettled([
          apiListProfiles({ role: 'consultant', limit: 10 }, token),
          apiListProfiles({ role: 'pharmacy', limit: 10 }, token),
          apiListProfiles({ role: 'lab', limit: 10 }, token),
          apiGetAppointments({ status: 'pending', limit: 5 }, token),
          apiGetAppointments({ status: 'confirmed', limit: 5 }, token),
          apiGetAppointments({ status: 'completed', limit: 5 }, token),
        ]);

      const listOf = <T,>(res: PromiseSettledResult<{ data: T[] }>) =>
        res.status === 'fulfilled' && Array.isArray(res.value.data)
          ? res.value.data
          : [];
      const totalOf = (
        res: PromiseSettledResult<{ data: unknown[]; meta: { total: number } }>
      ) =>
        res.status === 'fulfilled'
          ? (res.value.meta.total ?? res.value.data.length)
          : 0;

      setDoctors(listOf(doctorsRes));
      setPharma(listOf(pharmaRes));
      setLabs(listOf(labRes));
      setStats({
        doctors: totalOf(doctorsRes),
        pharmacies: totalOf(pharmaRes),
        labs: totalOf(labRes),
        pastAppointments: totalOf(pastRes),
      });

      const upcoming =
        [...listOf(pendingRes), ...listOf(confirmedRes)][0] ?? null;
      const recent = listOf(pastRes).slice(0, 2);
      setUpcomingAppt(upcoming);
      setRecentAppts(recent);

      // Fetch the doctors behind the upcoming and recent appointments
      const providerIds = Array.from(
        new Set(
          [upcoming, ...recent]
            .map((a) => a?.provider_id)
            .filter((id): id is string => !!id)
        )
      );
      const providers = await Promise.allSettled(
        providerIds.map((id) => apiGetProfileById(id, 'consultant', token))
      );
      const map = new Map<string, ProfileData>();
      providers.forEach((res, i) => {
        if (res.status === 'fulfilled') map.set(providerIds[i], res.value);
      });
      setProvidersById(map);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const timeoutId = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [token, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const upcomingDoc = upcomingAppt
    ? providersById.get(upcomingAppt.provider_id)
    : undefined;

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      scroll: {
        flex: 1,
        padding: theme.spacing.base,
        paddingBottom: theme.spacing.xxl + 20,
      },
      quickRow: {
        flexDirection: 'row',
        gap: theme.spacing.base,
        marginBottom: theme.spacing.xl,
      },
      quickCard: {
        flex: 1,
        backgroundColor: theme.colors.surfaceCardLight,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
      },
      quickTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      quickLabelRow: { flexDirection: 'row', alignItems: 'center' },
      quickImage: {
        width: 30,
        height: 30,
        borderRadius: 3,
      },
      quickCardLabel: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
        marginLeft: theme.spacing.xs,
      },
      quickBtn: {
        backgroundColor: theme.colors.primary.extraDeep,
        borderRadius: theme.radius.sm,
        paddingHorizontal: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        justifyContent: 'center',
        height: 40,
      },
      quickBtnText: {
        fontSize: theme.typography.sizes.base,
        color: theme.colors.buttonText,
      },
      section: { marginBottom: theme.spacing.xl },
      sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      sectionTitle: {
        fontSize: theme.typography.sizes.md,
        fontWeight: '500',
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
      },
      viewAll: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.purple.extraDeep,
        marginBottom: theme.spacing.sm,
      },
      apptCard: {
        backgroundColor: theme.colors.surfaceCardLight,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.base,
        gap: theme.spacing.md,
      },
      apptDoctorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 0.25,
        borderBottomColor: theme.colors.border,
        paddingBottom: theme.spacing.sm,
      },
      apptDocInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
      },
      apptImg: {
        width: 40,
        height: 40,
        borderRadius: 20,
      },
      apptDocName: {
        fontSize: theme.typography.sizes.md,
        fontWeight: '500',
        color: theme.colors.text,
      },
      apptDocSpec: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        textTransform: 'capitalize',
      },
      chatBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
      },
      apptMetaRow: {
        flexDirection: 'row',
        padding: theme.spacing.sm,
        gap: theme.spacing.sm,
      },
      apptMetaBox: { flex: 1, gap: 2 },
      apptMetaSep: {
        width: 0.5,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.xs,
      },
      apptMetaLabel: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textMuted,
      },
      apptMetaValue: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '500',
        color: theme.colors.text,
        textTransform: 'capitalize',
      },
      apptBtnRow: { flexDirection: 'row', gap: theme.spacing.md },
      apptBtnPrimary: {
        flex: 1,
        height: 40,
        backgroundColor: theme.colors.primary.extraDeep,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
      },
      apptBtnPrimaryText: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.buttonText,
      },
      apptBtnOutline: {
        flex: 1,
        height: 40,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.primary.extraDeep,
        alignItems: 'center',
        justifyContent: 'center',
      },
      apptBtnOutlineText: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.primary.extraDeep,
      },
      emptyCard: {
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.xl,
        alignItems: 'center',
        gap: theme.spacing.sm,
      },
      emptyText: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textMuted,
        textAlign: 'center',
      },
      emptyLink: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.primary.mid,
      },
      activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.base,
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.md,
      },
      activityIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.blue.bg,
        alignItems: 'center',
        justifyContent: 'center',
      },
      activityInfo: { flex: 1 },
      activityTitle: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.text,
      },
      activitySub: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textMuted,
      },
    })
  );

  const quickActions: {
    label: string;
    icon: IconSymbolName;
    button: string;
    to: Href;
  }[] = [
    {
      label: 'Appointment',
      icon: 'calendar',
      button: 'Book',
      to: '/appointments/speciality',
    },
    {
      label: 'Reports',
      icon: 'doc.text.fill',
      button: 'View',
      to: '/medicalHistory',
    },
  ];

  const providerSections = [
    {
      title: 'Available Doctors',
      empty: 'No doctors available',
      items: doctors.map((doc) => ({
        key: doc.id ?? doc.user_id,
        name: `Doctor ${doc.firstName ?? ''} ${doc.lastName ?? ''}`.trim(),
        subtitle: doc.speciality ?? 'General Practitioner',
        rating: doc.rating,
        pictureUrl: doc.profilePicture?.url,
        onPress: () =>
          doc.user_id &&
          router.push({
            pathname: '/appointments/doctor/[id]',
            params: { id: doc.user_id },
          }),
      })),
    },
    {
      title: 'Pharmacies',
      empty: 'No pharmacies available',
      items: pharma.map((pharm) => ({
        key: pharm.id ?? pharm.user_id,
        name: pharm.name ?? 'Pharmacy',
        subtitle: shortBio(pharm.bio, 'Drug Store'),
        rating: pharm.rating,
        pictureUrl: pharm.profilePicture?.url,
        onPress: () => router.push('/pharmacy'),
      })),
    },
    {
      title: 'Labs',
      empty: 'No laboratories available',
      items: labs.map((lab) => ({
        key: lab.id ?? lab.user_id,
        name: lab.name ?? 'Laboratory',
        subtitle: shortBio(lab.bio, 'Laboratory'),
        rating: lab.rating,
        pictureUrl: lab.profilePicture?.url,
        onPress: () => router.push('/lab'),
      })),
    },
  ];

  return (
    <ParallaxScrollView
      headerBackgroundColor={{
        light: appTheme.colors.blue.bg,
        dark: appTheme.colors.blue.bg,
      }}
      headerElement={
        <DashboardHeaderElement
          user={user}
          profile={profile}
          stats={stats}
          loading={loading}
          appTheme={appTheme}
        />
      }
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick actions */}
        <View style={styles.quickRow}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickCard}
              onPress={() => router.push(action.to)}
            >
              <View style={styles.quickTop}>
                <View style={styles.quickLabelRow}>
                  <IconSymbol
                    name={action.icon}
                    size={20}
                    color={appTheme.colors.textSecondary}
                  />
                  <Text style={styles.quickCardLabel}>{action.label}</Text>
                </View>
                <Image source={QuickImage} style={styles.quickImage} />
              </View>
              <View style={styles.quickBtn}>
                <Text style={styles.quickBtnText}>{action.button}</Text>
                <IconSymbol
                  name="chevron.right"
                  size={14}
                  color={appTheme.colors.buttonText}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming appointment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming/Recent Appointment</Text>
            <TouchableOpacity onPress={() => router.push('/appointments')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={appTheme.colors.primary.deep} />
          ) : upcomingAppt ? (
            <View style={styles.apptCard}>
              <View style={styles.apptDoctorRow}>
                <View style={styles.apptDocInfo}>
                  {upcomingDoc?.profile?.profilePicture?.url ? (
                    <Image
                      source={{ uri: upcomingDoc.profile.profilePicture.url }}
                      style={styles.apptImg}
                      contentFit="cover"
                    />
                  ) : (
                    <AvatarFromString
                      input={upcomingDoc?.profile?.firstName || 'Doctor'}
                      size={40}
                    />
                  )}
                  <View>
                    <Text style={styles.apptDocName}>
                      {providerName(upcomingDoc)}
                    </Text>
                    <Text style={styles.apptDocSpec}>
                      {upcomingDoc?.profile?.speciality ?? ''}
                    </Text>
                  </View>
                </View>
                <View style={styles.chatBtn}>
                  <IconSymbol
                    name="bubble.left.fill"
                    size={18}
                    color={appTheme.colors.textSecondary}
                  />
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
                  <Text style={styles.apptMetaValue}>
                    {upcomingAppt.status}
                  </Text>
                </View>
              </View>

              <View style={styles.apptBtnRow}>
                <TouchableOpacity
                  style={styles.apptBtnPrimary}
                  onPress={() =>
                    router.push({
                      pathname: '/appointments/book',
                      params: {
                        providerId: upcomingAppt.provider_id,
                        doctorName: providerName(upcomingDoc),
                      },
                    })
                  }
                >
                  <Text style={styles.apptBtnPrimaryText}>Re-schedule</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.apptBtnOutline}
                  onPress={() =>
                    router.push({
                      pathname: '/appointments/[id]',
                      params: { id: upcomingAppt.id },
                    })
                  }
                >
                  <Text style={styles.apptBtnOutlineText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No upcoming appointments</Text>
              <TouchableOpacity
                onPress={() => router.push('/appointments/book')}
              >
                <Text style={styles.emptyLink}>Book one now →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Doctors / pharmacies / labs */}
        {providerSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {loading ? (
              <ActivityIndicator color={appTheme.colors.primary.deep} />
            ) : section.items.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {section.items.map((item) => (
                  <ProviderCard
                    key={item.key}
                    name={item.name}
                    subtitle={item.subtitle}
                    rating={item.rating}
                    pictureUrl={item.pictureUrl}
                    appTheme={appTheme}
                    onPress={item.onPress}
                  />
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>{section.empty}</Text>
            )}
          </View>
        ))}

        {/* Recent activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentAppts.length === 0 && !loading ? (
            <Text style={styles.emptyText}>No recent activity</Text>
          ) : (
            recentAppts.map((appt) => (
              <View key={appt.id} style={styles.activityCard}>
                <View style={styles.activityIconBox}>
                  <IconSymbol
                    name="calendar"
                    size={20}
                    color={appTheme.colors.mono.dark}
                  />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>
                    Appointment completed
                  </Text>
                  <Text style={styles.activitySub}>
                    {providerName(providersById.get(appt.provider_id))} ·{' '}
                    {formatApptTime(appt.appointment_time)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ParallaxScrollView>
  );
}
