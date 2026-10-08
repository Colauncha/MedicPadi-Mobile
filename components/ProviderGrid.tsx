import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
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
import { apiListProfiles, ProfileFields } from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const PAGE_SIZE = 10;

const { width } = Dimensions.get('window');
const CARD_GAP = spacing.md;
const CARD_WIDTH = (width - spacing.base * 2 - CARD_GAP) / 2;

interface ProviderGridProps {
  role: 'lab' | 'pharmacy';
  title: string;
  searchPlaceholder: string;
  /** Shown when the provider has no name. */
  fallbackName: string;
  /** Shown in place of the address when the provider has none. */
  fallbackSubtitle: string;
  /** Plural noun used in the empty states, e.g. "labs". */
  emptyLabel: string;
  headerRight?: ReactNode;
}

/**
 * Paginated, searchable 2-column grid of lab or pharmacy profiles. Tapping a
 * card opens that provider's profile screen.
 */
export default function ProviderGrid({
  role,
  title,
  searchPlaceholder,
  fallbackName,
  fallbackSubtitle,
  emptyLabel,
  headerRight,
}: ProviderGridProps) {
  const { token } = useAuth();
  const { theme: appTheme } = useTheme();
  const [providers, setProviders] = useState<ProfileFields[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Prevent multiple onEndReached calls from fetching
  // the same page simultaneously.
  const loadingMoreRef = useRef(false);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      if (!token) return;
      if (pageNum > 1) {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }
      try {
        const res = await apiListProfiles(
          { role, page: pageNum, limit: PAGE_SIZE },
          token
        );
        const items = Array.isArray(res.data) ? res.data : [];
        setTotalPages(res.meta?.total_pages ?? 1);
        setProviders((prev) => (pageNum === 1 ? items : [...prev, ...items]));
        setPage(pageNum);
      } catch {
        if (pageNum === 1) setProviders([]);
      } finally {
        if (pageNum > 1) {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        }
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, role]
  );

  useEffect(() => {
    if (!token) return;

    const timeoutId = setTimeout(() => {
      void fetchPage(1);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [token, fetchPage]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPage(1);
  };

  const handleLoadMore = () => {
    if (!loadingMoreRef.current && page < totalPages) fetchPage(page + 1);
  };

  const query = search.trim().toLowerCase();
  const filtered = query
    ? providers.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.address?.toLowerCase().includes(query)
      )
    : providers;

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.base,
        paddingTop: theme.spacing.base,
        paddingBottom: theme.spacing.sm,
      },
      title: {
        fontSize: theme.typography.sizes.xl,
        fontFamily: theme.typography.fonts?.rounded,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
      },
      searchRow: {
        paddingHorizontal: theme.spacing.base,
        marginBottom: theme.spacing.base,
      },
      searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.lg,
        paddingHorizontal: theme.spacing.md,
        height: 44,
        gap: theme.spacing.sm,
      },
      searchInput: {
        flex: 1,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.text,
      },
      grid: { paddingHorizontal: theme.spacing.base, paddingBottom: 100 },
      row: { gap: CARD_GAP, marginBottom: CARD_GAP },
      emptyText: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
      },
      card: {
        width: CARD_WIDTH,
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.lg,
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.md,
      },
      avatarImg: { width: 64, height: 64, borderRadius: 7 },
      avatarWrapper: { marginBottom: theme.spacing.md },
      name: {
        fontSize: theme.typography.sizes.md,
        fontWeight: '500',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: 2,
      },
      address: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
        lineHeight: 18,
      },
      ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
      rating: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
      },
      loadMoreSpinner: { marginVertical: theme.spacing.lg },
    })
  );

  const renderProvider = ({ item }: { item: ProfileFields }) => {
    const name = item.name || fallbackName;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          item.user_id &&
          router.push({
            pathname: role === 'lab' ? '/lab/[id]' : '/pharmacy/[id]',
            params: { id: item.user_id },
          })
        }
      >
        <View style={styles.avatarWrapper}>
          {item.profilePicture?.url ? (
            <Image
              source={{ uri: item.profilePicture.url }}
              style={styles.avatarImg}
              contentFit="cover"
            />
          ) : (
            <AvatarFromString input={name} size={64} borderRadius={7} />
          )}
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.address} numberOfLines={2}>
          {item.address || fallbackSubtitle}
        </Text>
        <View style={styles.ratingRow}>
          <IconSymbol
            name="star.fill"
            size={14}
            color={appTheme.colors.primary.deep}
          />
          <Text style={styles.rating}>
            {item.rating != null ? Number(item.rating).toFixed(1) : '—'}
            {item.totalReviews ? ` (${item.totalReviews})` : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {headerRight}
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <IconSymbol
              name="magnifyingglass"
              size={18}
              color={appTheme.colors.textMuted}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor={appTheme.colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
        {loading ? (
          <ActivityIndicator
            style={{ marginTop: 40 }}
            color={appTheme.colors.primary.deep}
          />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item, i) => item.id ?? item.user_id ?? String(i)}
            renderItem={renderProvider}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator
                  style={styles.loadMoreSpinner}
                  color={appTheme.colors.primary.mid}
                />
              ) : null
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {query
                  ? `No ${emptyLabel} match your search`
                  : `No ${emptyLabel} available`}
              </Text>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
