import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { PatientStackParamList } from '../../navigation/types';
import { colors, typography, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import {
  ProfileFields,
  BusinessHours,
  DoctorEducation,
  apiGetProfileById,
} from '../../services/api';

type Nav = NativeStackNavigationProp<PatientStackParamList>;
type Route = RouteProp<PatientStackParamList, 'DoctorDetails'>;

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

// ── Sub-components ────────────────────────────────────────────────────────────

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => (
  <View style={styles.starRow}>
    {[1, 2, 3, 4, 5].map((i) => (
      <FontAwesome
        key={i}
        name={i <= Math.round(rating) ? 'star' : 'star-o'}
        size={size}
        color={colors.gold}
        style={{ marginRight: 1 }}
      />
    ))}
  </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────

export const DoctorProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { token } = useAuth();
  const doctorId = route.params?.doctorId;

  const [doctor, setDoctor] = useState<ProfileFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!doctorId || !token) {
      setLoading(false);
      return;
    }
    apiGetProfileById(doctorId, 'consultant', token)
      .then((res) => setDoctor(res.profile))
      .catch((e) => setError(e.message ?? 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [doctorId, token]);

  const fullName = doctor
    ? [doctor.firstName, doctor.lastName].filter(Boolean).join(' ')
    : '—';

  const bio = doctor?.bio ?? '';
  const previewLength = 220;
  const isLong = bio.length > previewLength;
  const displayBio = expanded || !isLong ? bio : bio.slice(0, previewLength) + '…';

  const hours = doctor?.businessHours;
  const education: DoctorEducation[] = doctor?.education ?? [];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnAbsolute}>
          <MaterialIcons name="arrow-back-ios" size={20} color={colors.text.dark} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back-ios" size={20} color={colors.text.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Doctor</Text>
        <View style={{ width: 32 }} />
      </View>

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
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons name="person" size={52} color={colors.primary[200]} />
                </View>
              )}
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.doctorName}>{`Dr. ${fullName}` || 'Doctor'}</Text>
              <Text style={styles.doctorMeta}>
                {[doctor?.speciality, doctor?.yearsOfService ? `${doctor.yearsOfService} yrs` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              {typeof doctor?.rating === 'number' && (
                <>
                  <StarRating rating={doctor.rating} size={13} />
                  <Text style={styles.reviewCount}>(220 reviews)</Text>
                </>
              )}
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {[
              { icon: 'call', label: 'Voice Call' },
              { icon: 'chat-bubble-outline', label: 'Chat' },
              { icon: 'videocam', label: 'Video' },
            ].map((btn) => (
              <TouchableOpacity key={btn.label} style={styles.actionBtn} activeOpacity={0.75}>
                <MaterialIcons name={btn.icon as any} size={20} color={colors.primary[900]} />
                <Text style={styles.actionLabel}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Clinic */}
        {doctor?.placeOfWork ? (
          <View style={styles.clinicRow}>
            <View style={styles.clinicIcon}>
              <MaterialIcons name="local-hospital" size={18} color={colors.primary[600]} />
            </View>
            <Text style={styles.clinicName}>{doctor.placeOfWork}</Text>
          </View>
        ) : null}

        {/* About Doctor */}
        {bio ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>About Doctor</Text>
              {doctor?.costPerSession ? (
                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>
                    Price: {formatNaira(doctor.costPerSession)}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.aboutText}>
              {displayBio}
              {isLong && (
                <Text onPress={() => setExpanded(!expanded)} style={styles.showMore}>
                  {expanded ? ' show less' : ' show more...'}
                </Text>
              )}
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>About Doctor</Text>
              {doctor?.costPerSession ? (
                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>
                    Price: {formatNaira(doctor.costPerSession)}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.aboutText, { color: colors.text.muted }]}>
              No bio available.
            </Text>
          </View>
        )}

        {/* Education & Qualification */}
        {education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education & Qualification</Text>
            {education.map((edu, i) => (
              <View key={i} style={styles.eduRow}>
                <View style={styles.eduIcon}>
                  <MaterialIcons name="school" size={20} color={colors.primary[600]} />
                </View>
                <View style={styles.eduText}>
                  <Text style={styles.eduName}>{edu.institution ?? '—'}</Text>
                  {edu.degree ? <Text style={styles.eduSub}>{edu.degree}</Text> : null}
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
              const isClosed =
                day.start === 'closed' || day.end === 'closed';
              const timeStr = isClosed
                ? 'Closed'
                : `${formatHour(day.start)} - ${formatHour(day.end)}`;
              return (
                <View key={key} style={styles.workRow}>
                  <Text style={styles.workDay}>{label}</Text>
                  <Text style={[styles.workHours, isClosed && styles.workClosed]}>
                    {timeStr}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Book Appointment CTA */}
      <View style={styles.ctaWrapper}>
        <TouchableOpacity
          style={styles.ctaBtn}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('BookAppointment', {
              doctorName: fullName,
              providerId: doctorId,
            })
          }
        >
          <Text style={styles.ctaText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.danger,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  backBtnAbsolute: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.base,
    zIndex: 10,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.lg,
    color: colors.text.medium,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.base },

  /* Hero */
  heroCard: {
    backgroundColor: colors.cardBlue,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  heroInner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  avatarWrapper: { marginRight: spacing.md },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: { flex: 1 },
  doctorName: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.lg,
    color: colors.text.dark,
    marginBottom: 2,
  },
  doctorMeta: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  starRow: { flexDirection: 'row', alignItems: 'center' },
  reviewCount: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around' },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    marginHorizontal: 4,
    gap: 4,
  },
  actionLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    color: colors.primary[900],
  },

  /* Clinic */
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  clinicIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicName: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
  },

  /* Sections */
  section: { marginBottom: spacing.base },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: typography.fonts.extraBold,
    fontWeight: 700,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  priceBadge: {
    backgroundColor: colors.primary[100],
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  priceText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.primary[900],
  },
  aboutText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.medium,
    lineHeight: 20,
  },
  showMore: {
    fontFamily: typography.fonts.semiBold,
    color: colors.primary[900],
  },

  /* Education */
  eduRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  eduIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  eduText: { flex: 1 },
  eduName: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
  },
  eduSub: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.text.light,
    marginTop: 2,
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.primary[50],
    borderRadius: radius.lg,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.md,
    color: colors.primary[900],
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.text.light,
  },

  /* Working hours */
  workRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  workDay: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.medium,
  },
  workHours: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
  },
  workClosed: { color: colors.danger },

  /* CTA */
  ctaWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    marginBottom:spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ctaBtn: {
    backgroundColor: colors.primary[950],
    borderRadius: radius.xl,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.base,
    color: colors.white,
  },
});
