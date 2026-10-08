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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  apiGetDrugs,
  apiGetLabTests,
  apiGetProfileById,
  BusinessHours,
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

const formatPrice = (price: number): string =>
  `₦${price.toLocaleString('en-NG')}`;

const BANNER_HEIGHT = 240;

// Tests (lab) or drugs (pharmacy), normalised for one list renderer.
interface ServiceItem {
  id: string;
  name: string;
  subtitle?: string;
  price: number;
  available?: boolean;
}

const CONFIG = {
  lab: {
    fallbackName: 'Laboratory',
    title: 'About Laboratory',
    servicesTitle: 'Available Tests',
    bannerIcon: 'flask.fill',
    cta: 'Book Test',
  },
  pharmacy: {
    fallbackName: 'Pharmacy',
    title: 'About Pharmacy',
    servicesTitle: 'Available Drugs',
    bannerIcon: 'pill.fill',
    cta: 'Order Drugs',
  },
} as const;

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

/**
 * Public profile of a lab or pharmacy: banner image, details, the tests or
 * drugs it offers, and its working hours.
 */
export default function ProviderProfile({
  role,
}: {
  role: 'lab' | 'pharmacy';
}) {
  const { id: providerId } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { theme: appTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 48;
  const config = CONFIG[role];

  const [provider, setProvider] = useState<ProfileFields | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!providerId || !token) return;
    apiGetProfileById(providerId, role, token)
      .then((res) => setProvider(res.profile))
      .catch((e) => setError(e.message ?? 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [providerId, role, token]);

  useEffect(() => {
    if (!providerId || !token) return;
    const load =
      role === 'lab'
        ? apiGetLabTests({ id: providerId, limit: 20 }, token).then((res) =>
            (Array.isArray(res.data) ? res.data : []).map((t) => ({
              id: t.id,
              name: t.name,
              subtitle: t.TAT ? `⏱ ${t.TAT}` : t.department?.name,
              price: t.price,
              available: t.available,
            }))
          )
        : apiGetDrugs({ id: providerId, limit: 20 }, token).then((res) =>
            (Array.isArray(res.data) ? res.data : []).map((d) => ({
              id: d.id,
              name: d.name,
              subtitle:
                d.category?.name ??
                (d.requiresPrescription ? 'Prescription' : 'OTC'),
              price: d.price,
              available: d.available,
            }))
          );
    load
      .then((services) => {
        console.log(services);
        setServices(services);
      })
      .catch(() => setServices([]));
  }, [providerId, role, token]);

  const name = provider?.name || config.fallbackName;

  const bio = provider?.bio ?? '';
  const previewLength = 220;
  const isLong = bio.length > previewLength;
  const displayBio =
    expanded || !isLong ? bio : bio.slice(0, previewLength) + '…';

  const hours = provider?.businessHours;

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      safe: { flex: 1, backgroundColor: theme.colors.background },
      center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
      errorText: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.danger,
        textAlign: 'center',
        paddingHorizontal: theme.spacing.xl,
      },
      backBtn: {
        position: 'absolute',
        left: theme.spacing.base,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        zIndex: 1,
      },
      scroll: { flex: 1 },

      banner: {
        width: '100%',
        height: BANNER_HEIGHT,
        backgroundColor: theme.colors.primary.shallow,
        alignItems: 'center',
        justifyContent: 'center',
      },
      bannerImage: { width: '100%', height: '100%' },
      body: {
        paddingHorizontal: theme.spacing.base,
        paddingBottom: theme.spacing.lg,
        marginTop: -theme.spacing.xl,
      },

      heroCard: {
        backgroundColor: theme.colors.surfaceCardLight,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.base,
        marginBottom: theme.spacing.base,
        gap: 4,
      },
      providerName: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: 'bold',
        color: theme.colors.text,
        textTransform: 'capitalize',
      },
      metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
      metaText: {
        flex: 1,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
      },
      reviewCount: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textMuted,
      },

      section: { marginBottom: theme.spacing.base },
      sectionTitle: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
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

      serviceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.sm,
      },
      serviceInfo: { flex: 1 },
      serviceName: {
        fontSize: theme.typography.sizes.md,
        fontWeight: '500',
        color: theme.colors.text,
      },
      serviceSub: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textSecondary,
        marginTop: 2,
      },
      unavailable: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.danger,
        marginTop: 2,
      },
      servicePrice: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '600',
        color: theme.colors.primary.mid,
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

  const backButton = (
    <TouchableOpacity
      onPress={() => router.back()}
      style={[styles.backBtn, { top: insets.top + 8 }]}
    >
      <IconSymbol name="chevron.left" size={24} color="#fff" />
    </TouchableOpacity>
  );

  if (loading || error) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.banner} />
        {backButton}
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

  const onCtaPress = () => {
    if (role === 'lab') {
      router.push({
        pathname: '/appointments/book',
        params: { providerId },
      });
    }
    // TODO: pharmacy ordering flow (no screen exists yet).
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      {backButton}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.banner}>
          {provider?.profilePicture?.url ? (
            <Image
              source={{ uri: provider.profilePicture.url }}
              style={styles.bannerImage}
              contentFit="cover"
            />
          ) : (
            <IconSymbol
              name={config.bannerIcon}
              size={72}
              color={appTheme.colors.primary.mid}
            />
          )}
        </View>

        <View style={styles.body}>
          {/* Hero card */}
          <View style={styles.heroCard}>
            <Text style={styles.providerName}>{name}</Text>
            {provider?.address ? (
              <View style={styles.metaRow}>
                <IconSymbol
                  name="pin.fill"
                  size={14}
                  color={appTheme.colors.textSecondary}
                />
                <Text style={styles.metaText}>{provider.address}</Text>
              </View>
            ) : null}
            {provider?.registrationNumber ? (
              <View style={styles.metaRow}>
                <IconSymbol
                  name="doc.text.fill"
                  size={14}
                  color={appTheme.colors.textSecondary}
                />
                <Text style={styles.metaText}>
                  Reg. No: {provider.registrationNumber}
                </Text>
              </View>
            ) : null}
            {typeof provider?.rating === 'number' && (
              <View style={styles.metaRow}>
                <StarRating
                  rating={provider.rating}
                  size={13}
                  color={appTheme.colors.warning}
                />
                <Text style={styles.reviewCount}>
                  ({provider.totalReviews ?? 0} reviews)
                </Text>
              </View>
            )}
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{config.title}</Text>
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
                No description available.
              </Text>
            )}
          </View>

          {/* Tests / Drugs */}
          {services.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{config.servicesTitle}</Text>
              {services.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.serviceRow}
                  activeOpacity={0.8}
                  disabled={role !== 'pharmacy'}
                  onPress={() =>
                    router.push({
                      pathname: '/pharmacy/drug/[id]',
                      params: { id: item.id, name: item.name },
                    })
                  }
                >
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.subtitle ? (
                      <Text style={styles.serviceSub} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                    {item.available === false && (
                      <Text style={styles.unavailable}>
                        Currently unavailable
                      </Text>
                    )}
                  </View>
                  <Text style={styles.servicePrice}>
                    {formatPrice(item.price)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

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
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaWrapper, { bottom: tabBarHeight }]}>
        <TouchableOpacity
          style={styles.ctaBtn}
          activeOpacity={0.85}
          onPress={onCtaPress}
        >
          <Text style={styles.ctaText}>{config.cta}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
