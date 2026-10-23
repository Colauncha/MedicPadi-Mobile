import { Image } from 'expo-image';
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
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  apiGetDrugs,
  apiGetLabTests,
  DrugData,
  LabTestData,
} from '@/services/api';
import { AppHeader } from '@/components/ui/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { truncate } from '@/utils';
import { IconSymbol } from './icon-symbol';
import { spacing } from '@/theme/tokens';

const PAGE_SIZE = 20;
const LOW_STOCK_THRESHOLD = 5;
const { width } = Dimensions.get('window');
const CARD_GAP = spacing.md;
const CARD_WIDTH = (width - spacing.base * 2 - CARD_GAP) / 2;

const formatPrice = (price: number): string =>
  `₦${price.toLocaleString('en-NG')}`;

const useFetchServices = ({
  providerId,
  role,
}: {
  providerId: string;
  role: 'lab' | 'pharmacy';
}) => {
  const { token } = useAuth();
  const [service, setService] = useState<DrugData[] | LabTestData[] | []>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadingMoreRef = useRef(false);

  const apiFunc = role === 'lab' ? apiGetLabTests : apiGetDrugs;

  const fetchService = useCallback(
    async (pageNum: number, isRefresh = false) => {
      if (!token) return;

      if (pageNum > 1 && loadingMoreRef.current) return;

      if (pageNum > 1) {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await apiFunc(
          { id: providerId, page: pageNum, limit: PAGE_SIZE },
          token
        );
        const items = Array.isArray(res.data) ? res.data : [];

        setTotalPages(res.meta?.total_pages ?? 1);
        setService((prev) => (pageNum === 1 ? items : [...prev, ...items]));
        setPage(pageNum);
      } catch (error) {
        console.error(error);
      } finally {
        if (pageNum > 1) {
          setLoadingMore(false);
          loadingMoreRef.current = false;
        } else {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [token, providerId, apiFunc]
  );

  useEffect(() => {
    if (!token) return;

    const timeoutId = setTimeout(() => {
      void fetchService(1);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [token, fetchService]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || loadingMore || page >= totalPages) return;

    fetchService(page + 1);
  }, [fetchService, loadingMore, page, totalPages]);

  return {
    service,
    loading: token ? loading : false,
    refreshing,
    loadingMore,
    loadMore,
    refresh: () => fetchService(1, true),
  };
};

const ViewAllServices = ({ role }: { role: 'lab' | 'pharmacy' }) => {
  const { id: providerId, name } = useLocalSearchParams<{
    id: string;
    name: string;
  }>();
  const { service, loading, refreshing, loadingMore, loadMore, refresh } =
    useFetchServices({ providerId, role });

  const { theme: appTheme } = useTheme();

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      appHeader: {
        paddingHorizontal: theme.spacing.base,
        marginBottom: 0,
      },
      scroll: {
        padding: theme.spacing.base,
        paddingBottom: 100,
        gap: CARD_GAP,
      },
      columnWrapper: { gap: CARD_GAP },
      loader: { marginTop: theme.spacing.xl },
      emptyText: {
        textAlign: 'center',
        marginTop: theme.spacing.xl,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },
      searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.xl,
        marginHorizontal: theme.spacing.base,
        marginBottom: theme.spacing.lg,
        paddingHorizontal: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: theme.spacing.sm,
      },
      searchInput: {
        flex: 1,
        height: 44,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.text,
      },

      // Card
      card: {
        width: CARD_WIDTH,
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.sm,
        overflow: 'hidden',
      },
      cardUnavailable: { opacity: 0.6 },
      media: {
        height: 96,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.primary.shallow,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginBottom: theme.spacing.sm,
      },
      mediaImage: { width: '100%', height: '100%' },
      mediaEmoji: { fontSize: 40 },
      badge: {
        position: 'absolute',
        top: theme.spacing.xs,
        left: theme.spacing.xs,
        backgroundColor: theme.colors.warningBg,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
      },
      badgeText: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '600',
        color: theme.colors.warning,
      },
      body: { flex: 1, justifyContent: 'space-between' },
      title: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '600',
        color: theme.colors.text,
      },
      subtitle: {
        marginTop: 2,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },
      footer: { marginTop: theme.spacing.sm },
      price: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '600',
        color: theme.colors.primary.extraDeep,
      },
      status: {
        marginTop: 2,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },
      statusWarn: { color: theme.colors.warning },
    })
  );

  const handlePress = (item: DrugData | LabTestData) => {
    if (role === 'pharmacy') {
      router.push(
        {
          pathname: '/pharmacy/drug/[id]',
          params: { id: item.id, name: item.name },
        },
        { withAnchor: true }
      );
      return;
    }
    // Lab test details screen not built yet
  };

  const renderDrug = (drug: DrugData) => {
    const outOfStock = drug.stock === 0;
    const unavailable = drug.available === false || outOfStock;
    const lowStock =
      !unavailable &&
      typeof drug.stock === 'number' &&
      drug.stock <= LOW_STOCK_THRESHOLD;

    const status = outOfStock
      ? 'Out of stock'
      : drug.available === false
        ? 'Unavailable'
        : lowStock
          ? `Only ${drug.stock} left`
          : null;

    return (
      <>
        <View style={styles.media}>
          {drug.drugImage?.url ? (
            <Image
              source={{ uri: drug.drugImage.url }}
              style={styles.mediaImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <Text style={styles.mediaEmoji}>💊</Text>
          )}
          {drug.requiresPrescription && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Rx</Text>
            </View>
          )}
        </View>
        <View style={styles.body}>
          <View>
            <Text style={styles.title} numberOfLines={2}>
              {drug.name}
            </Text>
            {drug.category?.name ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {drug.category.name}
              </Text>
            ) : null}
          </View>
          <View style={styles.footer}>
            <Text style={styles.price}>{formatPrice(drug.price)}</Text>
            {status ? (
              <Text style={[styles.status, styles.statusWarn]}>{status}</Text>
            ) : null}
          </View>
        </View>
      </>
    );
  };

  const renderLabTest = (test: LabTestData) => {
    const unavailable = test.available === false;

    return (
      <>
        <View style={styles.media}>
          <Text style={styles.mediaEmoji}>🧪</Text>
          {test.shortName ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{test.shortName}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.body}>
          <View>
            <Text style={styles.title} numberOfLines={2}>
              {test.name}
            </Text>
            {test.department?.name ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {test.department.name}
              </Text>
            ) : null}
          </View>
          <View style={styles.footer}>
            <Text style={styles.price}>{formatPrice(test.price)}</Text>
            {unavailable ? (
              <Text style={[styles.status, styles.statusWarn]}>
                Unavailable
              </Text>
            ) : test.TAT ? (
              <Text style={styles.status} numberOfLines={1}>
                Results in {test.TAT}
              </Text>
            ) : null}
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        title={`${truncate(name, 10)} ${role === 'lab' ? 'Tests' : 'Drugs'}`}
        style={styles.appHeader}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.searchRow}>
          <IconSymbol
            name="magnifyingglass"
            size={18}
            color={appTheme.colors.textMuted}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${role === 'lab' ? 'lab tests' : 'pharmacy drugs'}`}
            placeholderTextColor={appTheme.colors.textMuted}
            // value={query}
            // onChangeText={setQuery}
            returnKeyType="search"
          />
        </View>

        {loading ? (
          <ActivityIndicator
            style={styles.loader}
            color={appTheme.colors.primary.extraDeep}
          />
        ) : (
          <FlatList<DrugData | LabTestData>
            data={service}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.scroll}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor={appTheme.colors.primary.extraDeep}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator color={appTheme.colors.primary.extraDeep} />
              ) : null
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {role === 'lab' ? 'No lab tests yet' : 'No drugs yet'}
              </Text>
            }
            renderItem={({ item }) => {
              const unavailable =
                item.available === false ||
                (role === 'pharmacy' && (item as DrugData).stock === 0);

              return (
                <TouchableOpacity
                  style={[styles.card, unavailable && styles.cardUnavailable]}
                  activeOpacity={0.85}
                  onPress={() => handlePress(item)}
                >
                  {role === 'lab'
                    ? renderLabTest(item as LabTestData)
                    : renderDrug(item as DrugData)}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ViewAllServices;
