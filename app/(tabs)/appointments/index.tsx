// import {
//   ActivityIndicator,
//   FlatList,
//   Image,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// import { IconSymbol } from '@/components/ui/icon-symbol';
// import { useAuth } from '@/context/AuthContext';
// import { useThemedStyles } from '@/hooks/useThemedStyle';
// import {
//   apiGetAppointments,
//   AppointmentData,
//   Paginated,
//   // getDoctorsPatients,
// } from '@/services/api';
// import { useTheme } from '@/theme/ThemeProvider';
// // import { getAge } from '@/utils/formatter';
// import { useCallback, useEffect, useRef, useState } from 'react';
// import { AppointmentCard, AppointmentRequestRow } from '..';

// const PAGE_SIZE = 10;

// type FilterType = 'today' | 'request' | 'past' | 'upcoming' | 'all';

// const useFetchAppointments = () => {
//   const { token } = useAuth();

//   const [appointments, setAppointments] = useState<AppointmentData[]>([]);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);

//   const [loading, setLoading] = useState(true);
//   const [loadingMore, setLoadingMore] = useState(false);

//   const [filterType, setFilterType] = useState<FilterType>('all');

//   // Prevent multiple onEndReached calls from fetching
//   // the same page simultaneously.
//   const loadingMoreRef = useRef(false);

//   const fetchPage = useCallback(
//     async (pageNum: number) => {
//       // const extraFeield = {
//       //   ...{appointmentDate: filterType === 'today' ? new Date().toISOString().split('T')[0] : ''},
//       //   ...{status: filterType === 'request' ? 'request' :  filterType === 'past' ? 'completed' : ''},
//       // }
//       if (!token) return;

//       // Prevent duplicate pagination requests.
//       if (pageNum > 1 && loadingMoreRef.current) {
//         return;
//       }

//       if (pageNum === 1) {
//         setLoading(true);
//       } else {
//         loadingMoreRef.current = true;
//         setLoadingMore(true);
//       }

//       try {
//         let res: Paginated<AppointmentData>;
//         if (filterType === 'today'){
//           res = await apiGetAppointments(
//             {
//               page: pageNum,
//               limit: PAGE_SIZE,
//             },
//             token
//           );
//         }
//         const items = Array.isArray(res.data) ? res.data : [];

//         setTotalPages(res.meta?.total_pages ?? 1);

//         setAppointments((prev) =>
//           pageNum === 1 ? items : [...prev, ...items]
//         );

//         setPage(pageNum);
//       } catch (error) {
//         console.error('Failed to fetch appointments:', error);
//       } finally {
//         if (pageNum === 1) {
//           setLoading(false);
//         } else {
//           setLoadingMore(false);
//           loadingMoreRef.current = false;
//         }
//       }
//     },
//     [token]
//   );

//   useEffect(() => {
//     if (!token) {
//       return;
//     }

//     const timeoutId = setTimeout(() => {
//       void fetchPage(1);
//     }, 0);

//     return () => clearTimeout(timeoutId);
//   }, [token, fetchPage]);

//   const loadMore = useCallback(() => {
//     if (loadingMoreRef.current || loadingMore || page >= totalPages) {
//       return;
//     }

//     fetchPage(page + 1);
//   }, [fetchPage, loadingMore, page, totalPages]);

//   return {
//     appointments,
//     loading: token ? loading : false,
//     loadingMore,
//     page,
//     totalPages,
//     filterType,
//     setFilterType,
//     loadMore,
//     refresh: () => fetchPage(1),
//   };
// };

// export default function Appointments() {
//   const { theme: appTheme } = useTheme();

//   const { appointments, loading, loadingMore, filterType, setFilterType, loadMore, refresh } =
//     useFetchAppointments();

//   const styles = useThemedStyles((theme) =>
//     StyleSheet.create({
//       container: {
//         flex: 1,
//         backgroundColor: theme.colors.background,
//       },

//       search: {
//         flexDirection: 'row',
//         padding: theme.spacing.md,
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         borderWidth: 1,
//         borderColor: theme.colors.border,
//         margin: theme.spacing.md,
//         borderRadius: theme.radius.xl,
//         position: 'relative',
//       },

//       searchInput: {
//         width: '100%',
//         color: theme.colors.text,
//         fontFamily: theme.typography.fonts?.sans,
//         fontSize: theme.typography.sizes.md,
//       },

//       searchIcon: {
//         position: 'absolute',
//         right: 10,
//       },

//       list: {
//         padding: theme.spacing.base,
//         paddingBottom: 32,
//       },

//       card: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: theme.colors.surfaceCardLight,
//         borderRadius: theme.radius.lg,
//         padding: theme.spacing.md,
//         marginBottom: theme.spacing.md,
//         borderWidth: 1,
//         borderColor: theme.colors.border,
//         gap: theme.spacing.md,
//       },

//       avatar: {
//         width: 56,
//         height: 56,
//         borderRadius: 28,
//         overflow: 'hidden',
//         backgroundColor: theme.colors.surface,
//       },

//       avatarImg: {
//         width: 56,
//         height: 56,
//         borderRadius: 28,
//       },

//       info: {
//         flex: 1,
//       },

//       name: {
//         fontFamily: theme.typography.fonts?.sans,
//         fontSize: theme.typography.sizes.base,
//         color: theme.colors.textSecondary,
//         marginBottom: 2,
//       },

//       speciality: {
//         fontFamily: theme.typography.fonts?.sans,
//         fontSize: theme.typography.sizes.sm,
//         color: theme.colors.textMuted,
//         marginBottom: 4,
//         textTransform: 'capitalize',
//       },

//       loadMoreSpinner: {
//         marginVertical: theme.spacing.lg,
//       },

//       emptyContainer: {
//         alignItems: 'center',
//         marginTop: 64,
//         gap: theme.spacing.md,
//       },

//       emptyText: {
//         fontFamily: theme.typography.fonts?.sans,
//         fontSize: theme.typography.sizes.base,
//         color: theme.colors.textMuted,
//         textAlign: 'center',
//       },
//     })
//   );

//   const renderAppointments = useCallback(
//     ({ item }: { item: AppointmentData }) => {
//       // const name =
//       //   [item.firstName, item.lastName].filter(Boolean).join(' ') || 'Patient';

//       if (filterType === 'request') {
//         return <AppointmentRequestRow theme={appTheme} appointment={item} onAccept={() => {}} onDecline={() => {}}/>
//       } else if (filterType === 'today') {
//         return <AppointmentCard theme={appTheme} appointment={item} />
//       }
//     },
//     [appTheme, filterType]
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.search}>
//         <TextInput
//           placeholder="Search Patients"
//           placeholderTextColor={appTheme.colors.textMuted}
//           keyboardType="default"
//           style={styles.searchInput}
//         />
//         <IconSymbol
//           name={'magnifyingglass'}
//           size={20}
//           color={appTheme.colors.textMuted}
//           style={styles.searchIcon}
//         />
//       </View>
//       {loading ? (
//         <ActivityIndicator
//           style={{ flex: 1 }}
//           color={appTheme.colors.primary.extraDeep}
//         />
//       ) : (
//         <FlatList
//           data={appointments}
//           keyExtractor={(item, index) => item.id ?? item.id ?? String(index)}
//           renderItem={renderAppointments}
//           contentContainerStyle={styles.list}
//           showsVerticalScrollIndicator={false}
//           refreshing={loading}
//           onRefresh={refresh}
//           onEndReached={loadMore}
//           onEndReachedThreshold={0.3}
//           ListFooterComponent={
//             loadingMore ? (
//               <ActivityIndicator
//                 style={styles.loadMoreSpinner}
//                 color={appTheme.colors.primary.extraDeep}
//               />
//             ) : null
//           }
//           ListEmptyComponent={
//             <View style={styles.emptyContainer}>
//               <IconSymbol
//                 name="person.2.fill"
//                 size={48}
//                 color={appTheme.colors.textMuted}
//               />

//               <Text style={styles.emptyText}>No patients found</Text>
//             </View>
//           }
//         />
//       )}
//     </SafeAreaView>
//   );
// }

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
  AppointmentCard,
  AppointmentRequestRow,
} from '@/components/appointmentCards/AppointmentCards';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  apiGetAppointments,
  apiListProfiles,
  AppointmentData,
  Paginated,
  ProfileFields,
} from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';
import { useCallback, useEffect, useRef, useState } from 'react';

const PAGE_SIZE = 10;

type FilterType = 'today' | 'request' | 'past' | 'upcoming' | 'all';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'request', label: 'Requests' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
];

// Builds the extra query params for each filter.
// Only 'today' and 'request' are wired up for now — extend this
// as the API adds support for 'past' / 'upcoming'.
const getFilterParams = (filterType: FilterType) => {
  switch (filterType) {
    case 'today':
      return { appointmentTime: new Date().toISOString().split('T')[0] };
    case 'request':
      return { status: 'pending' };
    case 'past':
      return { status: 'completed', paymentStatus: 'payment_confimed' };
    case 'upcoming':
      return { status: 'confirmed', paymentStatus: 'payment_confimed' };
    default:
      return { status: '' };
  }
};

const useFetchAppointments = () => {
  const { token } = useAuth();

  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [patientsById, setPatientsById] = useState<
    Map<string | undefined, ProfileFields>
  >(new Map());

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [filterType, setFilterType] = useState<FilterType>('all');

  // Prevent multiple onEndReached calls from fetching
  // the same page simultaneously.
  const loadingMoreRef = useRef(false);

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
        const res: Paginated<AppointmentData> = await apiGetAppointments(
          {
            page: pageNum,
            limit: PAGE_SIZE,
            ...getFilterParams(activeFilter),
          },
          token
        );

        const items = Array.isArray(res.data) ? res.data : [];

        setTotalPages(res.meta?.total_pages ?? 1);

        setAppointments((prev) =>
          pageNum === 1 ? items : [...prev, ...items]
        );

        const patientIds = Array.from(
          new Set(res.data.map((a) => a.patient_id))
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

        setPage(pageNum);
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
    [token]
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

  return {
    appointments,
    loading: token ? loading : false,
    loadingMore,
    page,
    totalPages,
    filterType,
    patientsById,
    setFilterType,
    loadMore,
    refresh: () => fetchPage(1, filterType),
  };
};

export default function Appointments() {
  const { theme: appTheme } = useTheme();
  // let { status } = useLocalSearchParams<{ status: FilterType | '' }>();

  const {
    appointments,
    loading,
    loadingMore,
    filterType,
    patientsById,
    setFilterType,
    loadMore,
    refresh,
  } = useFetchAppointments();

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'flex-start',
      },

      search: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.sm,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: theme.colors.border,
        margin: theme.spacing.md,
        borderRadius: theme.radius.xl,
        position: 'relative',
        height: 40,
      },

      searchInput: {
        width: '100%',
        color: theme.colors.text,
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
      },

      searchIcon: {
        position: 'absolute',
        right: 10,
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
        textTransform: 'capitalize',
      },

      pillTextActive: {
        color: theme.colors.background,
      },

      list: {
        padding: theme.spacing.base,
        paddingBottom: 32,
        // borderWidth: 1,
      },

      card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceCardLight,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: theme.spacing.md,
      },

      avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
      },

      avatarImg: {
        width: 56,
        height: 56,
        borderRadius: 28,
      },

      info: {
        flex: 1,
      },

      name: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.textSecondary,
        marginBottom: 2,
      },

      speciality: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        marginBottom: 4,
        textTransform: 'capitalize',
      },

      loadMoreSpinner: {
        marginVertical: theme.spacing.lg,
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

      appointmentCards: {
        // borderWidth: 1,
        borderRadius: theme.radius.lg,
        // borderColor: theme.colors.border,
        marginVertical: theme.spacing.sm,
        padding: theme.spacing.base,
        backgroundColor: theme.colors.surfaceCardLight,
      },
    })
  );

  const renderAppointments = useCallback(
    ({ item }: { item: AppointmentData }) => {
      // setFilterType(status && status as FilterType);
      // status = ''
      if (filterType === 'request') {
        return (
          <AppointmentRequestRow
            theme={appTheme}
            appointment={item}
            patient={patientsById.get(item.patient_id)}
            extraStyle={styles.appointmentCards}
            onAccept={() => {}}
            onDecline={() => {}}
          />
        );
      }

      // 'today', 'upcoming', 'past', 'all' all render as a standard card
      return (
        <AppointmentCard
          theme={appTheme}
          appointment={item}
          patient={patientsById.get(item.patient_id)}
          extraStyle={styles.appointmentCards}
          // showImage
          showButton
          buttonText="View"
        />
      );
    },
    [appTheme, filterType, styles.appointmentCards, patientsById]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.search}>
        <TextInput
          placeholder="Search Appointments"
          placeholderTextColor={appTheme.colors.textMuted}
          keyboardType="default"
          style={styles.searchInput}
        />
        <IconSymbol
          name={'magnifyingglass'}
          size={20}
          color={appTheme.colors.textMuted}
          style={styles.searchIcon}
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
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {loading ? (
        <ActivityIndicator
          style={{ flex: 1 }}
          color={appTheme.colors.primary.extraDeep}
        />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item, index) => item.id ?? String(index)}
          renderItem={renderAppointments}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={refresh}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                style={styles.loadMoreSpinner}
                color={appTheme.colors.primary.extraDeep}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconSymbol
                name="person.2.fill"
                size={48}
                color={appTheme.colors.textMuted}
              />
              <Text style={styles.emptyText}>No Appointment yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
