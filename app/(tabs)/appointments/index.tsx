import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  doctorDisplayName,
  PatientAppointmentCard,
} from '@/components/appointmentCards/AppointmentCards';
import SpecialityGrid from '@/components/SpecialityGrid';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  apiGetAppointments,
  apiGetProfileById,
  AppointmentData,
  ProfileFields,
} from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';

const PAGE_SIZE = 10;
const UPCOMING_LIMIT = 50;

type Segment = 'appointments' | 'doctors';

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'appointments', label: 'Appointments' },
  { key: 'doctors', label: 'Doctors' },
];

type FilterType = 'all' | 'today' | 'upcoming';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
];

const listOf = (res: PromiseSettledResult<{ data: AppointmentData[] }>) =>
  res.status === 'fulfilled' && Array.isArray(res.value.data)
    ? res.value.data
    : [];

const useFetchAppointments = () => {
  const { token, user } = useAuth();
  const userId = user?.id ?? '';

  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [doctorsById, setDoctorsById] = useState<Map<string, ProfileFields>>(
    new Map()
  );

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [filterType, setFilterType] = useState<FilterType>('all');
  // When the list was last fetched; cards use it to decide what's upcoming.
  const [fetchedAt, setFetchedAt] = useState(0);

  // Prevent multiple onEndReached calls from fetching
  // the same page simultaneously.
  const loadingMoreRef = useRef(false);
  // Doctor profiles already resolved, shared across pages and filters.
  const doctorsRef = useRef(new Map<string, ProfileFields>());

  const resolveDoctors = useCallback(
    async (items: AppointmentData[]) => {
      if (!token) return;
      const cache = doctorsRef.current;

      items.forEach((a) => {
        if (a.provider && !cache.has(a.provider_id)) {
          cache.set(a.provider_id, a.provider);
        }
      });

      const missing = Array.from(
        new Set(items.map((a) => a.provider_id).filter((id) => !cache.has(id)))
      );
      const results = await Promise.allSettled(
        missing.map((id) => apiGetProfileById(id, 'consultant', token))
      );
      results.forEach((res, i) => {
        if (res.status === 'fulfilled') cache.set(missing[i], res.value.profile);
      });

      setDoctorsById(new Map(cache));
    },
    [token]
  );

  const fetchPage = useCallback(
    async (pageNum: number, activeFilter: FilterType) => {
      if (!token) return;

      // Prevent duplicate pagination requests.
      if (pageNum > 1 && loadingMoreRef.current) {
        return;
      }

      if (pageNum === 1) {
        setLoading(true);
      } else {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }

      try {
        let items: AppointmentData[];
        const now = Date.now();
        setFetchedAt(now);

        if (activeFilter === 'upcoming') {
          // Pending + confirmed, still in the future, soonest first.
          const [pendingRes, confirmedRes] = await Promise.allSettled([
            apiGetAppointments(
              { id: userId, status: 'pending', limit: UPCOMING_LIMIT },
              token
            ),
            apiGetAppointments(
              { id: userId, status: 'confirmed', limit: UPCOMING_LIMIT },
              token
            ),
          ]);
          items = [...listOf(pendingRes), ...listOf(confirmedRes)]
            .filter((a) => new Date(a.appointment_time).getTime() >= now)
            .sort(
              (a, b) =>
                new Date(a.appointment_time).getTime() -
                new Date(b.appointment_time).getTime()
            );
          setTotalPages(1);
          setAppointments(items);
        } else {
          const res = await apiGetAppointments(
            {
              id: userId,
              page: pageNum,
              limit: PAGE_SIZE,
              ...(activeFilter === 'today'
                ? { appointmentTime: new Date().toISOString().split('T')[0] }
                : {}),
            },
            token
          );
          items = Array.isArray(res.data) ? res.data : [];
          setTotalPages(res.meta?.total_pages ?? 1);
          setAppointments((prev) =>
            pageNum === 1 ? items : [...prev, ...items]
          );
        }

        setPage(pageNum);
        await resolveDoctors(items);
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
      } finally {
        if (pageNum === 1) {
          setLoading(false);
        } else {
          setLoadingMore(false);
          loadingMoreRef.current = false;
        }
      }
    },
    [token, userId, resolveDoctors]
  );

  // Refetch from page 1 whenever the filter changes.
  useEffect(() => {
    if (!token) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void fetchPage(1, filterType);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [token, filterType, fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || loadingMore || page >= totalPages) {
      return;
    }

    fetchPage(page + 1, filterType);
  }, [fetchPage, loadingMore, page, totalPages, filterType]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPage(1, filterType);
    setRefreshing(false);
  }, [fetchPage, filterType]);

  return {
    appointments,
    doctorsById,
    fetchedAt,
    loading: token ? loading : false,
    loadingMore,
    refreshing,
    filterType,
    setFilterType,
    loadMore,
    refresh,
  };
};

export default function Appointments() {
  const { theme: appTheme } = useTheme();
  const { tab } = useLocalSearchParams<{ tab?: Segment }>();
  const [segment, setSegment] = useState<Segment>(
    tab === 'doctors' ? 'doctors' : 'appointments'
  );
  const [search, setSearch] = useState('');

  const {
    appointments,
    doctorsById,
    fetchedAt,
    loading,
    loadingMore,
    refreshing,
    filterType,
    setFilterType,
    loadMore,
    refresh,
  } = useFetchAppointments();

  const visibleAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return appointments;
    return appointments.filter((a) => {
      const doctor = doctorsById.get(a.provider_id);
      return [
        doctorDisplayName(doctor),
        doctor?.speciality,
        a.description,
        a.status,
      ].some((field) => field?.toLowerCase().includes(query));
    });
  }, [appointments, doctorsById, search]);

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },

      segmentBar: {
        flexDirection: 'row',
        margin: theme.spacing.md,
        padding: 4,
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },

      segment: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.xl,
      },

      segmentActive: {
        backgroundColor: theme.colors.primary.extraDeep,
      },

      segmentText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.md,
        fontWeight: '600',
        color: theme.colors.textMuted,
      },

      segmentTextActive: {
        color: theme.colors.buttonText,
      },

      search: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.sm,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderRadius: theme.radius.xl,
        height: 40,
        gap: theme.spacing.sm,
      },

      searchInput: {
        flex: 1,
        color: theme.colors.text,
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
      },

      filterRow: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.sm,
        height: 35,
        alignItems: 'center',
      },

      pill: {
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      },

      pillActive: {
        backgroundColor: theme.colors.primary.extraDeep,
        borderColor: theme.colors.primary.extraDeep,
      },

      pillText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },

      pillTextActive: {
        color: theme.colors.buttonText,
      },

      list: {
        padding: theme.spacing.base,
        paddingBottom: 100,
      },

      card: {
        marginVertical: theme.spacing.sm,
      },

      loadMoreSpinner: {
        marginVertical: theme.spacing.lg,
      },

      bookBtn: {
        marginTop: theme.spacing.lg,
      },

      emptyContainer: {
        alignItems: 'center',
        marginTop: 64,
        gap: theme.spacing.md,
      },

      emptyText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.textMuted,
        textAlign: 'center',
      },
    })
  );

  const renderAppointment = useCallback(
    ({ item }: { item: AppointmentData }) => (
      <PatientAppointmentCard
        theme={appTheme}
        appointment={item}
        doctor={doctorsById.get(item.provider_id)}
        now={fetchedAt}
        extraStyle={styles.card}
      />
    ),
    [appTheme, doctorsById, fetchedAt, styles.card]
  );

  const emptyMessage = search.trim()
    ? 'No appointments match your search'
    : filterType === 'today'
      ? 'No appointments today'
      : filterType === 'upcoming'
        ? 'No upcoming appointments'
        : 'No appointments yet';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.segmentBar}>
        {SEGMENTS.map((s) => {
          const active = segment === s.key;
          return (
            <TouchableOpacity
              key={s.key}
              style={[styles.segment, active && styles.segmentActive]}
              onPress={() => setSegment(s.key)}
            >
              <Text
                style={[styles.segmentText, active && styles.segmentTextActive]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {segment === 'doctors' ? (
        <SpecialityGrid />
      ) : (
        <>
          <View style={styles.search}>
            <TextInput
              placeholder="Search appointments"
              placeholderTextColor={appTheme.colors.textMuted}
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
            <IconSymbol
              name="magnifyingglass"
              size={20}
              color={appTheme.colors.textMuted}
            />
          </View>

          <FlatList
            horizontal
            data={FILTERS}
            style={{ flexGrow: 0 }}
            keyExtractor={(f) => f.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            renderItem={({ item }) => {
              const active = filterType === item.key;
              return (
                <TouchableOpacity
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setFilterType(item.key)}
                >
                  <Text
                    style={[styles.pillText, active && styles.pillTextActive]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {loading && !refreshing ? (
            <ActivityIndicator
              style={{ flex: 1 }}
              color={appTheme.colors.primary.extraDeep}
            />
          ) : (
            <FlatList
              data={visibleAppointments}
              keyExtractor={(item, index) => item.id ?? String(index)}
              renderItem={renderAppointment}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={refresh}
              onEndReached={loadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                <>
                  {loadingMore && (
                    <ActivityIndicator
                      style={styles.loadMoreSpinner}
                      color={appTheme.colors.primary.extraDeep}
                    />
                  )}
                  <Button
                    label="Book New Appointment"
                    onPress={() => setSegment('doctors')}
                    style={styles.bookBtn}
                  />
                </>
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <IconSymbol
                    name="calendar"
                    size={48}
                    color={appTheme.colors.textMuted}
                  />
                  <Text style={styles.emptyText}>{emptyMessage}</Text>
                </View>
              }
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}
