// import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  apiGetProfileById,
  BusinessHours,
  DoctorEducation,
  ProfileFields,
} from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatHour = (h: number | 'closed'): string => {
  if (h === 'closed') return 'Closed';
  const period = h < 12 ? 'AM' : 'PM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${period}`;
};

type DayKey = Exclude<keyof BusinessHours, 'id'>;

const DAY_LABELS: { key: DayKey; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const formatNaira = (value: string | undefined): string => {
  if (!value) return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
};

const ACTIONS: { icon: IconSymbolName; label: string }[] = [
  { icon: 'phone.fill', label: 'Voice Call' },
  { icon: 'bubble.left', label: 'Chat' },
  { icon: 'video.fill', label: 'Video' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

const StarRating = ({
  rating,
  size = 14,
  color,
}: {
  rating: number;
  size?: number;
  color: string;
}) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <IconSymbol
        key={i}
        name={i <= Math.round(rating) ? 'star.fill' : 'star'}
        size={size}
        color={color}
        style={{ marginRight: 1 }}
      />
    ))}
  </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────

export default function DoctorProfileScreen() {
  const { id: doctorId } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { theme: appTheme } = useTheme();
  const tabBarHeight = 48; //useBottomTabBarHeight();

  const [doctor, setDoctor] = useState<ProfileFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!doctorId || !token) return;
    apiGetProfileById(doctorId, 'consultant', token)
      .then((res) => setDoctor(res.profile))
      .catch((e) => setError(e.message ?? 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [doctorId, token]);

  const fullName = doctor
    ? [doctor.firstName, doctor.lastName].filter(Boolean).join(' ')
    : '';

  const bio = doctor?.bio ?? '';
  const previewLength = 220;
  const isLong = bio.length > previewLength;
  const displayBio =
    expanded || !isLong ? bio : bio.slice(0, previewLength) + '…';

  const hours = doctor?.businessHours;
  const education: DoctorEducation[] = doctor?.education ?? [];

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      safe: {
        flex: 1,
        backgroundColor: theme.colors.background,
        // paddingBottom: theme.spacing.xxl,
      },
      center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
      errorText: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.danger,
        textAlign: 'center',
        paddingHorizontal: theme.spacing.xl,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.md,
      },
      backBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
      },
      headerTitle: {
        fontSize: theme.typography.sizes.xl,
        fontFamily: theme.typography.fonts?.rounded,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
      },
      scroll: { flex: 1 },
      scrollContent: {
        paddingHorizontal: theme.spacing.base,
        paddingBottom: theme.spacing.lg,
      },

      heroCard: {
        backgroundColor: theme.colors.surfaceCardLight,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.base,
        marginBottom: theme.spacing.base,
      },
      heroInner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.base,
      },
      avatarWrapper: { marginRight: theme.spacing.md },
      avatarImage: { width: 90, height: 90, borderRadius: 45 },
      avatarPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: theme.colors.primary.base,
        alignItems: 'center',
        justifyContent: 'center',
      },
      heroInfo: { flex: 1 },
      doctorName: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 2,
      },
      doctorMeta: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
        marginBottom: 4,
        textTransform: 'capitalize',
      },
      reviewCount: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textMuted,
        marginTop: 2,
      },
      actionRow: { flexDirection: 'row', justifyContent: 'space-around' },
      actionBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.lg,
        paddingVertical: theme.spacing.sm,
        marginHorizontal: 4,
        gap: 4,
      },
      actionLabel: {
        fontSize: theme.typography.sizes.xs,
        fontWeight: '500',
        color: theme.colors.primary.deep,
      },

      clinicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.base,
        gap: theme.spacing.sm,
      },
      iconBubble: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: theme.colors.primary.base,
        alignItems: 'center',
        justifyContent: 'center',
      },
      clinicName: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '600',
        color: theme.colors.text,
      },

      section: { marginBottom: theme.spacing.base },
      sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
      },
      sectionTitle: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
      },
      priceBadge: {
        backgroundColor: theme.colors.surfaceCardLight,
        borderRadius: theme.radius.full,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 4,
      },
      priceText: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '600',
        color: theme.colors.primary.extraDeep,
      },
      aboutText: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
        lineHeight: 20,
      },
      noBio: { color: theme.colors.textMuted },
      showMore: {
        fontWeight: '600',
        color: theme.colors.primary.deep,
      },

      eduRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.sm,
      },
      eduText: { flex: 1 },
      eduName: {
        fontSize: theme.typography.sizes.md,
        fontWeight: 'bold',
        color: theme.colors.text,
      },
      eduSub: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textSecondary,
        marginTop: 2,
      },

      statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.base,
        gap: theme.spacing.sm,
      },
      statCard: {
        flex: 1,
        backgroundColor: theme.colors.primary.shallow,
        borderRadius: theme.radius.lg,
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
      },
      statValue: {
        fontSize: theme.typography.sizes.md,
        fontWeight: 'bold',
        color: theme.colors.primary.deep,
        marginBottom: 2,
      },
      statLabel: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textSecondary,
      },

      workRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      workDay: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
      },
      workHours: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '500',
        color: theme.colors.text,
      },
      workClosed: { color: theme.colors.danger },

      ctaWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.md,
        paddingBottom: theme.spacing.xxl * 2,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      },
      ctaBtn: {
        backgroundColor: theme.colors.primary.extraDeep,
        borderRadius: theme.radius.xl,
        paddingVertical: theme.spacing.base,
        alignItems: 'center',
      },
      ctaText: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '600',
        color: theme.colors.buttonText,
      },
    })
  );

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <IconSymbol
          name="chevron.left"
          size={24}
          color={appTheme.colors.text}
        />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>About Doctor</Text>
      <View style={{ width: 32 }} />
    </View>
  );

  if (loading || error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        {header}
        <View style={styles.center}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <ActivityIndicator
              size="large"
              color={appTheme.colors.primary.mid}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const priceBadge = doctor?.costPerSession ? (
    <View style={styles.priceBadge}>
      <Text style={styles.priceText}>
        Price: {formatNaira(doctor.costPerSession)}
      </Text>
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {header}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroInner}>
            <View style={styles.avatarWrapper}>
              {doctor?.profilePicture?.url ? (
                <Image
                  source={{ uri: doctor.profilePicture.url }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <IconSymbol
                    name="person.fill"
                    size={52}
                    color={appTheme.colors.primary.mid}
                  />
                </View>
              )}
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.doctorName}>
                {fullName ? `Dr. ${fullName}` : 'Doctor'}
              </Text>
              <Text style={styles.doctorMeta}>
                {[
                  doctor?.speciality,
                  doctor?.yearsOfService
                    ? `${doctor.yearsOfService} yrs`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              {typeof doctor?.rating === 'number' && (
                <>
                  <StarRating
                    rating={doctor.rating}
                    size={13}
                    color={appTheme.colors.warning}
                  />
                  <Text style={styles.reviewCount}>
                    ({doctor.totalReviews ?? 0} reviews)
                  </Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.actionRow}>
            {ACTIONS.map((btn) => (
              <TouchableOpacity
                key={btn.label}
                style={styles.actionBtn}
                activeOpacity={0.75}
              >
                <IconSymbol
                  name={btn.icon}
                  size={20}
                  color={appTheme.colors.primary.deep}
                />
                <Text style={styles.actionLabel}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Clinic */}
        {doctor?.placeOfWork ? (
          <View style={styles.clinicRow}>
            <View style={styles.iconBubble}>
              <IconSymbol
                name="cross.case.fill"
                size={18}
                color={appTheme.colors.primary.mid}
              />
            </View>
            <Text style={styles.clinicName}>{doctor.placeOfWork}</Text>
          </View>
        ) : null}

        {/* About Doctor */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>About Doctor</Text>
            {priceBadge}
          </View>
          {bio ? (
            <Text style={styles.aboutText}>
              {displayBio}
              {isLong && (
                <Text
                  onPress={() => setExpanded(!expanded)}
                  style={styles.showMore}
                >
                  {expanded ? ' show less' : ' show more...'}
                </Text>
              )}
            </Text>
          ) : (
            <Text style={[styles.aboutText, styles.noBio]}>
              No bio available.
            </Text>
          )}
        </View>

        {/* Education & Qualification */}
        {education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education & Qualification</Text>
            {education.map((edu, i) => (
              <View key={i} style={styles.eduRow}>
                <View style={styles.iconBubble}>
                  <IconSymbol
                    name="graduationcap.fill"
                    size={20}
                    color={appTheme.colors.primary.mid}
                  />
                </View>
                <View style={styles.eduText}>
                  <Text style={styles.eduName}>{edu.institution ?? '—'}</Text>
                  {edu.degree ? (
                    <Text style={styles.eduSub}>{edu.degree}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {doctor?.yearsOfService ? `${doctor.yearsOfService} Yrs` : '—'}
            </Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{doctor?.awards ?? '—'}</Text>
            <Text style={styles.statLabel}>Awards</Text>
          </View>
        </View>

        {/* Working Time */}
        {hours && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Working Time</Text>
            {DAY_LABELS.map(({ key, label }) => {
              const day = hours[key];
              if (!day) return null;
              const isClosed = day.start === 'closed' || day.end === 'closed';
              const timeStr = isClosed
                ? 'Closed'
                : `${formatHour(day.start)} - ${formatHour(day.end)}`;
              return (
                <View key={key} style={styles.workRow}>
                  <Text style={styles.workDay}>{label}</Text>
                  <Text
                    style={[styles.workHours, isClosed && styles.workClosed]}
                  >
                    {timeStr}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: tabBarHeight + 100 }} />
      </ScrollView>

      {/* Book Appointment CTA */}
      <View style={[styles.ctaWrapper, { bottom: tabBarHeight }]}>
        <TouchableOpacity
          style={styles.ctaBtn}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: '/appointments/book',
              params: { providerId: doctorId, doctorName: fullName },
            })
          }
        >
          <Text style={styles.ctaText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
