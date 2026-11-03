import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { apiListDrugRequisition, DrugReqList } from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';
import { formatDate } from '@/utils/formatter';
import {
  formatPrice,
  statusColors,
  toAmount,
  toLabel,
} from '@/utils/orderStatus';

const PAGE_SIZE = 20;

const useFetchOrders = () => {
  const { token } = useAuth();

  const [orders, setOrders] = useState<DrugReqList[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent multiple onEndReached calls from fetching
  // the same page simultaneously.
  const loadingMoreRef = useRef(false);

  const fetchPage = useCallback(
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
        const res = await apiListDrugRequisition(
          { page: pageNum, limit: PAGE_SIZE },
          token
        );
        const items = Array.isArray(res.data) ? res.data : [];

        setTotalPages(res.meta?.total_pages ?? 1);
        setOrders((prev) => (pageNum === 1 ? items : [...prev, ...items]));
        setPage(pageNum);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        if (pageNum === 1) setError("Couldn't load your orders.");
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
    [token]
  );

  useEffect(() => {
    if (!token) return;

    const timeoutId = setTimeout(() => {
      void fetchPage(1);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [token, fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || loadingMore || page >= totalPages) return;

    fetchPage(page + 1);
  }, [fetchPage, loadingMore, page, totalPages]);

  return {
    orders,
    loading: token ? loading : false,
    refreshing,
    loadingMore,
    error,
    loadMore,
    refresh: () => fetchPage(1, true),
    retry: () => fetchPage(1),
  };
};

const Orders = () => {
  const { theme: appTheme } = useTheme();
  const {
    orders,
    loading,
    refreshing,
    loadingMore,
    error,
    loadMore,
    refresh,
    retry,
  } = useFetchOrders();

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      appHeader: {
        paddingHorizontal: theme.spacing.base,
        marginBottom: 0,
      },
      list: {
        padding: theme.spacing.base,
        paddingBottom: 100,
        gap: theme.spacing.md,
        flexGrow: 1,
      },
      loader: { marginTop: theme.spacing.xl },
      center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.base,
        gap: theme.spacing.sm,
      },
      emptyEmoji: { fontSize: 56 },
      emptyTitle: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: '600',
        color: theme.colors.text,
      },
      emptyBody: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
      },

      // Order card
      card: {
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.base,
      },
      cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
      },
      iconBox: {
        width: 44,
        height: 44,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.primary.shallow,
        alignItems: 'center',
        justifyContent: 'center',
      },
      cardInfo: { flex: 1 },
      orderId: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '600',
        color: theme.colors.text,
      },
      orderDate: {
        marginTop: 2,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },
      badge: {
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
      },
      badgeText: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '600',
      },
      address: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
      },
      cardBottom: {
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      paymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
      },
      paymentLabel: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },
      total: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '600',
        color: theme.colors.text,
      },
    })
  );

  const openOrder = (order: DrugReqList) =>
    router.push(
      { pathname: '/pharmacy/trackOrder', params: { id: order.id } },
      { withAnchor: true }
    );

  const renderBadge = (raw: string) => {
    const { bg, fg } = statusColors(appTheme, raw);
    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: fg }]}>{toLabel(raw)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Orders" style={styles.appHeader} />
      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          color={appTheme.colors.primary.extraDeep}
        />
      ) : error && orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptyBody}>{error}</Text>
          <Button label="Try again" onPress={retry} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptyBody}>
                Drugs you order from a pharmacy will show up here.
              </Text>
              <Button label="Browse pharmacies" onPress={() => router.back()} />
            </View>
          }
          renderItem={({ item: order }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => openOrder(order)}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconBox}>
                  <IconSymbol
                    name="shippingbox"
                    size={22}
                    color={appTheme.colors.primary.extraDeep}
                  />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.orderId} numberOfLines={1}>
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </Text>
                  <Text style={styles.orderDate}>
                    {formatDate(order.createdAt, true)}
                  </Text>
                </View>
                {renderBadge(order.status)}
              </View>

              {order.delivery_address ? (
                <Text style={styles.address} numberOfLines={1}>
                  📍 {order.delivery_address}
                </Text>
              ) : null}

              <View style={styles.cardBottom}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Payment:</Text>
                  {renderBadge(order.payment_status)}
                </View>
                <Text style={styles.total}>
                  {formatPrice(toAmount(order.total_amount))}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default Orders;
