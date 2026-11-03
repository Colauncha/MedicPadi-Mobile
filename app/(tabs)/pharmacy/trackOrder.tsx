import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AppHeader } from '@/components/ui/AppHeader';
import { AppAlert } from '@/components/ui/alert';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  apiCancelDrugRequisition,
  apiGetDrugRequisition,
  apiListProfiles,
  apiReceiveDrugRequisition,
  DrugReqDetail,
  ProfileFields,
} from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';
import { formatDate } from '@/utils/formatter';
import {
  formatPrice,
  statusColors,
  toAmount,
  toLabel,
} from '@/utils/orderStatus';

// Mirrors RequisitionStatus on the backend, minus `cancelled`,
// which is shown as a banner instead of a step.
const STEPS: { status: string; title: string; body: string }[] = [
  {
    status: 'pending',
    title: 'Order placed',
    body: 'Waiting for the pharmacy to accept your order.',
  },
  {
    status: 'accepted',
    title: 'Accepted',
    body: 'The pharmacy has accepted your order.',
  },
  {
    status: 'processing',
    title: 'Processing',
    body: 'Your medication is being prepared.',
  },
  {
    status: 'ready',
    title: 'Ready',
    body: 'Your order is ready and on its way.',
  },
  {
    status: 'completed',
    title: 'Received',
    body: 'You have received your order.',
  },
];

const PAID_STATUSES = ['paid', 'escrow'];

const TrackOrder = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { theme: appTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const [order, setOrder] = useState<DrugReqDetail | null>(null);
  const [pharmacy, setPharmacy] = useState<ProfileFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<'receive' | 'cancel' | null>(null);

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      appHeader: {
        paddingHorizontal: theme.spacing.base,
        marginBottom: 0,
      },
      loader: { marginTop: theme.spacing.xl },
      center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.base,
        gap: theme.spacing.sm,
      },
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
      scroll: { padding: theme.spacing.base, gap: theme.spacing.base },

      card: {
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.base,
      },
      sectionTitle: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
      },

      // Summary header
      headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing.sm,
      },
      orderId: {
        fontSize: theme.typography.sizes.lg,
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
      banner: {
        marginTop: theme.spacing.md,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
      },
      bannerText: {
        fontSize: theme.typography.sizes.sm,
        lineHeight: 20,
      },

      // Timeline
      step: { flexDirection: 'row', gap: theme.spacing.md },
      rail: { alignItems: 'center', width: 20 },
      dot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
      },
      dotDone: {
        borderColor: theme.colors.primary.extraDeep,
        backgroundColor: theme.colors.primary.extraDeep,
      },
      dotCurrent: { borderColor: theme.colors.primary.extraDeep },
      dotInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary.extraDeep,
      },
      dotCheck: {
        color: theme.colors.buttonText,
        fontSize: 11,
        fontWeight: '700',
      },
      line: {
        flex: 1,
        width: 2,
        minHeight: 24,
        backgroundColor: theme.colors.border,
      },
      lineDone: { backgroundColor: theme.colors.primary.extraDeep },
      stepBody: { flex: 1, paddingBottom: theme.spacing.base },
      stepTitle: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '500',
        color: theme.colors.textMuted,
      },
      stepTitleActive: { color: theme.colors.text, fontWeight: '600' },
      stepText: {
        marginTop: 2,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },

      // Pharmacy
      pharmRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
      },
      pharmAvatar: {
        width: 48,
        height: 48,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.primary.shallow,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      },
      pharmAvatarImage: { width: '100%', height: '100%' },
      pharmEmoji: { fontSize: 24 },
      pharmInfo: { flex: 1 },
      pharmName: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '600',
        color: theme.colors.text,
      },
      pharmMeta: {
        marginTop: 2,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },

      // Line items
      itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
      },
      itemRowFirst: { borderTopWidth: 0, paddingTop: 0 },
      itemName: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '500',
        color: theme.colors.text,
      },
      itemUnit: {
        marginTop: 2,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },
      rxTag: {
        alignSelf: 'flex-start',
        marginTop: theme.spacing.xs,
        backgroundColor: theme.colors.warningBg,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
      },
      rxTagText: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '600',
        color: theme.colors.warning,
      },
      lineTotal: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '600',
        color: theme.colors.text,
      },

      // Summary rows
      summary: {
        marginTop: theme.spacing.sm,
        paddingTop: theme.spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
        gap: theme.spacing.xs,
      },
      summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      summaryLabel: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },
      summaryValue: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
      },
      totalLabel: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '600',
        color: theme.colors.text,
      },
      totalValue: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '600',
        color: theme.colors.text,
      },

      // Delivery details
      detailLabel: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },
      detailValue: {
        marginTop: 2,
        marginBottom: theme.spacing.md,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.text,
      },

      footer: {
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.base,
        paddingTop: theme.spacing.md,
        backgroundColor: theme.colors.background,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
      },
    })
  );

  const fetchOrder = useCallback(
    async (isRefresh = false) => {
      if (!token || !id) return;

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await apiGetDrugRequisition(id, token);
        setOrder(res);
        setError(null);

        // The pharmacy card is a nice-to-have, so its failure shouldn't
        // block the order from showing.
        apiListProfiles({ id: res.pharmacy_id, role: 'pharmacy' }, token)
          .then((p) => setPharmacy(p?.data?.[0] ?? null))
          .catch((e) => console.error('Failed to fetch pharmacy:', e));
      } catch (err) {
        console.error('Failed to fetch order:', err);
        setError("Couldn't load this order.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, id]
  );

  useEffect(() => {
    if (!token || !id) return;

    const timeoutId = setTimeout(() => {
      void fetchOrder();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [token, id, fetchOrder]);

  const handleReceive = () => {
    if (!order || !token) return;

    AppAlert.alert(
      'Confirm delivery',
      'Only confirm once you have your medication. This releases payment to the pharmacy.',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: "I've received it",
          onPress: async () => {
            setActing('receive');
            try {
              await apiReceiveDrugRequisition(order.id, token);
              await fetchOrder(true);
            } catch (err) {
              AppAlert.alert(
                "Couldn't confirm delivery",
                err instanceof Error ? err.message : 'Please try again.',
                [],
                { variant: 'error' }
              );
            } finally {
              setActing(null);
            }
          },
        },
      ],
      { variant: 'info' }
    );
  };

  const handleCancel = () => {
    if (!order || !token) return;

    AppAlert.alert(
      'Cancel order?',
      'This order will be removed and the pharmacy will not process it.',
      [
        { text: 'Keep order', style: 'cancel' },
        {
          text: 'Cancel order',
          style: 'destructive',
          onPress: async () => {
            setActing('cancel');
            try {
              await apiCancelDrugRequisition(order.id, token);
              router.replace(
                { pathname: '/(tabs)/pharmacy/orders' },
                { withAnchor: true }
              );
            } catch (err) {
              AppAlert.alert(
                "Couldn't cancel order",
                err instanceof Error ? err.message : 'Please try again.',
                [],
                { variant: 'error' }
              );
            } finally {
              setActing(null);
            }
          },
        },
      ],
      { variant: 'warning' }
    );
  };

  const renderBadge = (raw: string) => {
    const { bg, fg } = statusColors(appTheme, raw);
    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: fg }]}>{toLabel(raw)}</Text>
      </View>
    );
  };

  // ---- States -------------------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader title="Track Order" style={styles.appHeader} />
        <ActivityIndicator
          style={styles.loader}
          color={appTheme.colors.primary.extraDeep}
        />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader title="Track Order" style={styles.appHeader} />
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptyBody}>
            {error ?? "We couldn't find this order."}
          </Text>
          <Button label="Try again" onPress={() => fetchOrder()} />
        </View>
      </SafeAreaView>
    );
  }

  // ---- Main ---------------------------------------------------------------

  const status = order.status?.toLowerCase();
  const isCancelled = status === 'cancelled';
  const isPaid = PAID_STATUSES.includes(order.payment_status?.toLowerCase());
  const currentStep = STEPS.findIndex((s) => s.status === status);

  const itemsTotal = order.items.reduce(
    (sum, i) => sum + toAmount(i.unit_price) * i.quantity,
    0
  );
  const delivery = toAmount(order.delivery_cost);

  const canReceive = isPaid && !isCancelled && status !== 'completed';
  const canCancel = status === 'pending' && !isPaid;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Track Order" style={styles.appHeader} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOrder(true)}
            tintColor={appTheme.colors.primary.extraDeep}
          />
        }
      >
        {/* Summary */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.orderId}>
                Order #{order.id.slice(0, 8).toUpperCase()}
              </Text>
              <Text style={styles.orderDate}>
                Placed {formatDate(order.createdAt, true)}
              </Text>
            </View>
            {renderBadge(order.status)}
          </View>

          {isCancelled ? (
            <View
              style={[
                styles.banner,
                { backgroundColor: appTheme.colors.dangerBg },
              ]}
            >
              <Text
                style={[styles.bannerText, { color: appTheme.colors.danger }]}
              >
                This order was cancelled.
              </Text>
            </View>
          ) : !isPaid ? (
            <View
              style={[
                styles.banner,
                { backgroundColor: appTheme.colors.warningBg },
              ]}
            >
              <Text
                style={[styles.bannerText, { color: appTheme.colors.warning }]}
              >
                Payment {toLabel(order.payment_status).toLowerCase()}. The
                pharmacy will start on your order once payment is confirmed.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Timeline */}
        {!isCancelled && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Order status</Text>
            {STEPS.map((step, i) => {
              const done = i < currentStep || status === 'completed';
              const current = i === currentStep && !done;
              const isLast = i === STEPS.length - 1;

              return (
                <View key={step.status} style={styles.step}>
                  <View style={styles.rail}>
                    <View
                      style={[
                        styles.dot,
                        done && styles.dotDone,
                        current && styles.dotCurrent,
                      ]}
                    >
                      {done ? (
                        <Text style={styles.dotCheck}>✓</Text>
                      ) : current ? (
                        <View style={styles.dotInner} />
                      ) : null}
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.line,
                          i < currentStep && styles.lineDone,
                        ]}
                      />
                    )}
                  </View>
                  <View
                    style={[styles.stepBody, isLast && { paddingBottom: 0 }]}
                  >
                    <Text
                      style={[
                        styles.stepTitle,
                        (done || current) && styles.stepTitleActive,
                      ]}
                    >
                      {step.title}
                    </Text>
                    {current && (
                      <Text style={styles.stepText}>{step.body}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Pharmacy */}
        {pharmacy && (
          <View style={styles.card}>
            <View style={styles.pharmRow}>
              <View style={styles.pharmAvatar}>
                {pharmacy.profilePicture?.url ? (
                  <Image
                    source={{ uri: pharmacy.profilePicture.url }}
                    style={styles.pharmAvatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.pharmEmoji}>🏥</Text>
                )}
              </View>
              <View style={styles.pharmInfo}>
                <Text style={styles.pharmName} numberOfLines={1}>
                  {pharmacy.name ?? 'Pharmacy'}
                </Text>
                {pharmacy.address ? (
                  <Text style={styles.pharmMeta} numberOfLines={2}>
                    {pharmacy.address}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        )}

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items.map((item, i) => (
            <View
              key={item.id}
              style={[styles.itemRow, i === 0 && styles.itemRowFirst]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.medication_name}</Text>
                <Text style={styles.itemUnit}>
                  {item.quantity} × {formatPrice(toAmount(item.unit_price))}
                </Text>
                {item.requiresPrescription && (
                  <View style={styles.rxTag}>
                    <Text style={styles.rxTagText}>Rx only</Text>
                  </View>
                )}
              </View>
              <Text style={styles.lineTotal}>
                {formatPrice(toAmount(item.unit_price) * item.quantity)}
              </Text>
            </View>
          ))}

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items</Text>
              <Text style={styles.summaryValue}>{formatPrice(itemsTotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={styles.summaryValue}>
                {delivery > 0 ? formatPrice(delivery) : 'Free'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment</Text>
              {renderBadge(order.payment_status)}
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatPrice(toAmount(order.total_amount))}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery details</Text>
          <Text style={styles.detailLabel}>Address</Text>
          <Text style={styles.detailValue}>
            {order.delivery_address || '—'}
          </Text>
          {order.notes ? (
            <>
              <Text style={styles.detailLabel}>Note to pharmacy</Text>
              <Text style={styles.detailValue}>{order.notes}</Text>
            </>
          ) : null}
        </View>
      </ScrollView>

      {(canReceive || canCancel) && (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 75) },
          ]}
        >
          {canReceive && (
            <Button
              label="I've received my order"
              onPress={handleReceive}
              loading={acting === 'receive'}
              disabled={acting !== null}
            />
          )}
          {canCancel && (
            <Button
              label="Cancel order"
              variant="outline"
              onPress={handleCancel}
              loading={acting === 'cancel'}
              disabled={acting !== null}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

export default TrackOrder;
