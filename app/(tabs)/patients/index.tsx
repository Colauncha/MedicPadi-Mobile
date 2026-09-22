import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AvatarFromString from '@/components/avatar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { getDoctorsPatients, ProfileFields } from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';
import { getAge } from '@/utils/formatter';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

const PAGE_SIZE = 10;

const useFetchPatients = () => {
  const { token } = useAuth();

  const [patients, setPatients] = useState<ProfileFields[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Prevent multiple onEndReached calls from fetching
  // the same page simultaneously.
  const loadingMoreRef = useRef(false);

  const fetchPage = useCallback(
    async (pageNum: number) => {
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
        const res = await getDoctorsPatients(
          {
            page: pageNum,
            limit: PAGE_SIZE,
          },
          token
        );

        const items = Array.isArray(res.data) ? res.data : [];

        setTotalPages(res.meta?.total_pages ?? 1);

        setPatients((prev) => (pageNum === 1 ? items : [...prev, ...items]));

        setPage(pageNum);
      } catch (error) {
        console.error('Failed to fetch patients:', error);
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

  useEffect(() => {
    if (!token) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void fetchPage(1);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [token, fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || loadingMore || page >= totalPages) {
      return;
    }

    fetchPage(page + 1);
  }, [fetchPage, loadingMore, page, totalPages]);

  return {
    patients,
    loading: token ? loading : false,
    loadingMore,
    page,
    totalPages,
    loadMore,
    refresh: () => fetchPage(1),
  };
};

export default function Patients() {
  const { theme: appTheme } = useTheme();

  const { patients, loading, loadingMore, loadMore, refresh } =
    useFetchPatients();

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },

      search: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.md,
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

      list: {
        padding: theme.spacing.base,
        paddingBottom: 32,
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
    })
  );

  const renderPatient = useCallback(
    ({ item }: { item: ProfileFields }) => {
      const name =
        [item.firstName, item.lastName].filter(Boolean).join(' ') || 'Patient';

      return (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => router.push(`/patients/${item.id}`)}
        >
          <View style={styles.avatar}>
            {item.profilePicture?.url ? (
              <Image
                source={{ uri: item.profilePicture.url }}
                style={styles.avatarImg}
              />
            ) : (
              <AvatarFromString input={name} size={56} />
            )}
          </View>

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>

            <Text style={styles.speciality} numberOfLines={1}>
              {item.gender}
            </Text>

            <Text style={styles.speciality} numberOfLines={1}>
              {getAge(item.dateOfBirth || '')}
            </Text>
          </View>

          <IconSymbol
            name="chevron.right"
            size={20}
            color={appTheme.colors.primary.extraDeep}
          />
        </TouchableOpacity>
      );
    },
    [styles, appTheme.colors.primary.extraDeep]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.search}>
        <TextInput
          placeholder="Search Patients"
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
      {loading ? (
        <ActivityIndicator
          style={{ flex: 1 }}
          color={appTheme.colors.primary.extraDeep}
        />
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item, index) =>
            item.id ?? item.user_id ?? String(index)
          }
          renderItem={renderPatient}
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

              <Text style={styles.emptyText}>No patients found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
