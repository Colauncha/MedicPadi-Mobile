import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  apiGetDoctorStats,
  apiGetProfile,
  DoctorStatsResponse,
} from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';
import { useTruncateJsx } from '@/utils';
import { formatTimeAdv, TimeFormat } from '@/utils/formatter';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type BusinessHour = {
  start: number;
  end: number;
};

type BusinessHours = Record<string, BusinessHour>;

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

const DAY_LABELS: Record<(typeof DAYS_OF_WEEK)[number], string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const ProfilePage = () => {
  const { user, token, profile, setProfile, logout } = useAuth();
  const { theme: appTheme } = useTheme();
  const [stats, setStats] = useState<DoctorStatsResponse | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },

      scroll: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: theme.spacing.base,
        paddingBottom: theme.spacing.xxl + 60,
      },

      header: {
        marginTop: theme.spacing.lg,
        borderRadius: theme.radius.xl,
        width: '100%',
        maxWidth: 500,
        flexDirection: 'row',
        paddingVertical: theme.spacing.xxl,
        paddingHorizontal: theme.spacing.base,
        backgroundColor: theme.colors.surfaceCardLight,
        alignItems: 'center',
        gap: theme.spacing.base,
        position: 'relative',
        flexWrap: 'wrap',
      },

      headerTitle: {
        fontSize: theme.typography.sizes.xl,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
      },

      headerSubTitle: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        textTransform: 'capitalize',
        marginBottom: theme.spacing.xs,
      },

      headerIconsView: {
        position: 'absolute',
        bottom: -50,
        right: 0,
        flexDirection: 'row',
        gap: theme.spacing.base,
      },

      headerIcons: {
        padding: theme.spacing.sm,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.surfaceCardLight,
      },

      avatarContainer: {
        position: 'relative',
      },

      avatar: {
        width: 100,
        height: 100,
        borderRadius: theme.radius.full,
        borderWidth: 3,
        borderColor: theme.colors.border,
      },

      avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceCardLight,
        borderRadius: theme.radius.full,
      },

      section: {
        width: '100%',
        maxWidth: 500,
        paddingVertical: theme.spacing.md,
        marginTop: theme.spacing.xxl + 10,
        alignItems: 'flex-start',
      },

      bioSectionTItleRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginTop: 5,
      },

      bioSectionTItle: {
        fontSize: theme.typography.sizes.lg,
        flex: 1,
      },

      bioSectionPrice: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.sizes.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceCardLight,
      },

      bioSectionPriceSubTItle: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textMuted,
      },

      bioText: {
        fontFamily: theme.typography.fonts?.serif,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textSecondary,
        paddingVertical: theme.spacing.md,
        lineHeight: 22,
      },

      showAllStyle: {
        fontFamily: theme.typography.fonts?.serif,
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.primary.extraDeep,
      },

      emptyText: {
        color: theme.colors.textMuted,
        fontSize: theme.typography.sizes.sm,
        paddingTop: theme.spacing.md,
      },

      qualificationCard: {
        width: '100%',
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginTop: theme.spacing.md,
        borderWidth: 0,
        borderColor: theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
      },

      qualificationIcon: {
        padding: theme.spacing.md,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.surfaceCardLight,
      },

      qualificationTitle: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
      },

      qualificationSubtitle: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },

      infoSection: {
        flexDirection: 'row',
        flexGrow: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
      },

      infoSectionItem: {
        width: '30%',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surfaceCardLight,
        borderRadius: theme.radius.lg,
        alignItems: 'center',
      },

      infoSectionTitle: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        fontWeight: '800',
      },

      infoSectionValue: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textSecondary,
      },

      editButton: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceCardLight,
      },

      editText: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.sizes.sm,
      },

      workingHoursContainer: {
        width: '100%',
        marginTop: theme.spacing.md,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        backgroundColor: theme.colors.surfaceCard,
        borderWidth: 0,
        borderColor: theme.colors.border,
      },

      workingHoursRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.border,
      },

      workingHoursRowLast: {
        borderBottomWidth: 0,
      },

      workingHoursDay: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
        fontWeight: '600',
      },

      workingHoursTime: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },
    })
  );

  const handleRefresh = useCallback(async () => {
    if (!token) {
      return;
    }

    setRefreshing(true);

    try {
      const response = await apiGetProfile(token);
      if (response) {
        setProfile(response);
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    } finally {
      setRefreshing(false);
    }
  }, [token, setProfile]);

  useEffect(() => {
    if (!token || !user) {
      router.replace('/login?redirect=profile');
    }

    (async () => {
      try {
        const response = await apiGetDoctorStats(token || '');
        if (response) setStats(response);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [token, user]);

  const bio = useTruncateJsx({
    input: profile?.profile.bio?.trim() ?? '',
    len: 150,
    showAllTrigger: true,
    TextElement: ThemedText,
    inputStyle: styles.bioText,
    showAllStyle: styles.showAllStyle,
  });

  /*
   * Don't render the profile screen while authentication
   * is being resolved / after redirect has been triggered.
   */
  if (!token || !user) {
    return null;
  }

  const consultantProfile = profile?.profile ?? null;

  const profilePic = consultantProfile?.profilePicture?.url ?? null;

  const fullName =
    consultantProfile?.firstName && consultantProfile?.lastName
      ? `Dr. ${consultantProfile.firstName} ${consultantProfile.lastName}`
      : user.email;

  const rating =
    consultantProfile?.rating != null
      ? (consultantProfile.rating.toFixed?.(2) ?? consultantProfile.rating)
      : '0.00';

  const totalReviews = consultantProfile?.totalReviews ?? 0;

  const price =
    consultantProfile?.costPerSession != null
      ? consultantProfile.costPerSession
      : 0;

  const qualifications = consultantProfile?.education ?? [];

  const experience = consultantProfile?.yearsOfService ?? 0;

  const awards = consultantProfile?.awards ?? 0;

  const businessHoursEntry = consultantProfile?.businessHours ?? {};
  const businessHours = businessHoursEntry as BusinessHours;

  const orderedBusinessHours = DAYS_OF_WEEK.filter(
    (day) => businessHours[day]
  ).map((day) => ({
    day,
    label: DAY_LABELS[day],
    hours: businessHours[day],
  }));

  const timeFormat: TimeFormat = '12h';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={appTheme.colors.textSecondary}
            colors={[appTheme.colors.textSecondary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <IconSymbol
                  name="person.fill"
                  size={60}
                  color={appTheme.colors.textMuted}
                />
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <ThemedText
              type="title"
              style={styles.headerTitle}
              numberOfLines={2}
            >
              {fullName}
            </ThemedText>

            <ThemedText
              type="subtitle"
              style={styles.headerSubTitle}
              numberOfLines={1}
            >
              {consultantProfile?.speciality
                ? consultantProfile.speciality
                : 'Consultant'}
              {' • '}
              {consultantProfile?.yearsOfService != null
                ? `${consultantProfile.yearsOfService} years`
                : (consultantProfile?.gender ?? '')}
            </ThemedText>

            <ThemedText type="subtitle" style={styles.headerSubTitle}>
              {rating} ({totalReviews}{' '}
              {totalReviews === 1 ? 'review' : 'reviews'})
            </ThemedText>
          </View>

          <View style={styles.headerIconsView}>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
            >
              <IconSymbol
                name="gearshape.fill"
                color={appTheme.colors.textSecondary}
                style={styles.headerIcons}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/editProfile')}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <IconSymbol
                name="pencil.line"
                color={appTheme.colors.textSecondary}
                style={styles.headerIcons}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => logout()}
              accessibilityRole="button"
              accessibilityLabel="Logout"
            >
              <IconSymbol
                name="door.left.hand.open"
                color={appTheme.colors.danger}
                style={[
                  styles.headerIcons,
                  { backgroundColor: appTheme.colors.dangerBg },
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bio */}
        <View style={[styles.section]}>
          <View style={styles.bioSectionTItleRow}>
            <ThemedText type="title" style={styles.bioSectionTItle}>
              Bio
            </ThemedText>

            <ThemedText style={styles.bioSectionPrice}>
              ₦{Number(price).toLocaleString()}
              <ThemedText
                type="subtitle"
                style={styles.bioSectionPriceSubTItle}
              >
                {' '}
                /session
              </ThemedText>
            </ThemedText>
          </View>

          <ThemedText type="default" style={styles.bioText}>
            {bio ??
              'Edit your profile to add a short description about yourself.'}
          </ThemedText>
        </View>

        {/* Education & Qualifications */}
        <View style={[styles.section, { marginTop: -5 }]}>
          <View style={styles.bioSectionTItleRow}>
            <ThemedText type="title" style={styles.bioSectionTItle}>
              Education & Qualification
            </ThemedText>

            <TouchableOpacity
              onPress={() => router.push('/editProfile')}
              accessibilityRole="button"
              accessibilityLabel="Edit education and qualifications"
              style={styles.editButton}
            >
              <ThemedText style={styles.editText}>Edit</ThemedText>
              <IconSymbol
                name={'pencil.line'}
                size={12}
                style={styles.bioSectionPrice}
              />
            </TouchableOpacity>
          </View>

          {qualifications.length > 0 ? (
            qualifications.map((qualification: any, index: number) => (
              <View
                key={qualification.id ?? index}
                style={styles.qualificationCard}
              >
                <IconSymbol
                  name={'graduationcap.fill'}
                  size={30}
                  color={appTheme.colors.textSecondary}
                  style={styles.qualificationIcon}
                />
                <View>
                  <ThemedText
                    type="defaultSemiBold"
                    style={styles.qualificationTitle}
                  >
                    {qualification.title ??
                      qualification.degree ??
                      qualification.name}
                  </ThemedText>

                  {(qualification.institution || qualification.school) && (
                    <ThemedText
                      type="subtitle"
                      style={styles.qualificationSubtitle}
                    >
                      {qualification.institution ?? qualification.school}
                    </ThemedText>
                  )}

                  {qualification.year && (
                    <ThemedText
                      type="subtitle"
                      style={styles.qualificationSubtitle}
                    >
                      {qualification.year}
                    </ThemedText>
                  )}
                </View>
              </View>
            ))
          ) : (
            <ThemedText style={styles.emptyText}>
              No education or qualifications have been added yet.
            </ThemedText>
          )}
        </View>

        {/* Info cards */}
        <View style={[styles.section, styles.infoSection, { marginTop: -5 }]}>
          <View style={styles.infoSectionItem}>
            <ThemedText type="default" style={styles.infoSectionTitle}>
              Patients
            </ThemedText>
            <ThemedText type="default" style={styles.infoSectionValue}>
              {stats?.totalPatients}
            </ThemedText>
          </View>
          <View style={styles.infoSectionItem}>
            <ThemedText type="default" style={styles.infoSectionTitle}>
              Experience
            </ThemedText>
            <ThemedText type="default" style={styles.infoSectionValue}>
              {experience} years
            </ThemedText>
          </View>
          <View style={styles.infoSectionItem}>
            <ThemedText type="default" style={styles.infoSectionTitle}>
              Awards
            </ThemedText>
            <ThemedText type="default" style={styles.infoSectionValue}>
              {awards}
            </ThemedText>
          </View>
        </View>

        {/* Working Hours */}
        <View style={[styles.section, { marginTop: -5 }]}>
          <View style={styles.bioSectionTItleRow}>
            <ThemedText type="title" style={styles.bioSectionTItle}>
              Working Hours
            </ThemedText>

            <TouchableOpacity
              onPress={() => router.push('/editProfile')}
              accessibilityRole="button"
              accessibilityLabel="Edit working hours"
              style={styles.editButton}
            >
              <ThemedText style={styles.editText}>Edit</ThemedText>

              <IconSymbol
                name="pencil.line"
                size={12}
                style={styles.bioSectionPrice}
              />
            </TouchableOpacity>
          </View>

          {orderedBusinessHours.length > 0 ? (
            <View style={styles.workingHoursContainer}>
              {orderedBusinessHours.map(({ day, label, hours }) => (
                <View
                  key={day}
                  style={[
                    styles.workingHoursRow,
                    ...[day === 'sunday' && styles.workingHoursRowLast],
                  ]}
                >
                  <ThemedText style={styles.workingHoursDay}>
                    {label}
                  </ThemedText>

                  <ThemedText style={styles.workingHoursTime}>
                    {formatTimeAdv(hours.start, timeFormat)}
                    {' - '}
                    {formatTimeAdv(hours.end, timeFormat)}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText style={styles.emptyText}>
              No working hours have been added yet.
            </ThemedText>
          )}
        </View>

        {/* Reviews  */}
        {/* <View style={[styles.section, { marginTop: -5 }]}>
          <View style={styles.bioSectionTItleRow}>
            <ThemedText type="title" style={styles.bioSectionTItle}>
              Patie
            </ThemedText>

            <TouchableOpacity
              onPress={() => router.push('/editProfile')}
              accessibilityRole="button"
              accessibilityLabel="Edit education and qualifications"
              style={styles.editButton}
            >
              <ThemedText style={styles.editText}>Edit</ThemedText>
              <IconSymbol
                name={'pencil.line'}
                size={12}
                style={styles.bioSectionPrice}
              />
            </TouchableOpacity>
          </View>
          <View></View>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfilePage;
