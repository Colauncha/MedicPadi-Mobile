import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { useCart, DrugReqData, DrugReqItem } from '@/context/CartContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  apiCreateDrugRequisition,
  apiListProfiles,
  DrugData,
  ProfileFields,
} from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';
import { AppHeader } from '@/components/ui/AppHeader';
import { useAuth } from '@/context/AuthContext';
import { AppAlert } from '@/components/ui/alert';

const formatPrice = (price: number): string =>
  `₦${price.toLocaleString('en-NG')}`;

const itemsTotalOf = (req: DrugReqData): number =>
  req.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

const needsPrescription = (req: DrugReqData): boolean =>
  req.items.some((i) => i.requiresPrescription);

// `delivery_cost` is typed as `boolean` in ProfileFields, which is almost
// certainly a typo for `number`. Read it defensively so it works either way:
// numbers (or numeric strings) count, anything else is treated as free.
const deliveryCostOf = (profile?: ProfileFields): number => {
  const raw: string | undefined = profile?.deliveryCost;
  const n = typeof raw === 'string' ? parseFloat(raw) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// The cart stores line items, but its actions take a DrugData. Rebuild the
// minimum needed. `stock: null` means no client-side cap at checkout; the
// server should still validate stock when the order is placed.
const toDrug = (item: DrugReqItem): DrugData => ({
  id: item.pharmacy_drug_id,
  name: item.medication_name,
  price: item.unit_price,
  requiresPrescription: item.requiresPrescription,
  stock: null,
  sideEffect: '',
  linkToMedWebsite: '',
});

// TODO: wire this to your orders endpoint, e.g.
//   await apiCreateDrugRequisition(req, token);
// It throws for now so an order is never cleared from the cart without
// actually being sent.
const submitRequisition = async (
  _req: DrugReqData & { patient_id: string },
  token: string
): Promise<void> => {
  try {
    // console.log('Sending request...');
    const res = await apiCreateDrugRequisition(_req, token);
    if (res) {
      AppAlert.alert(
        'Order Placed successfully',
        'Your order has been placed successfully, please proceed to make payment to confirm your order',
        [
          {
            text: 'Ok',
            onPress: () => {
              router.push(
                {
                  pathname: '/pharmacy/payment',
                  params: {
                    reference: res.tranx?.reference,
                    url: res.tranx?.authorization_url,
                  },
                },
                { withAnchor: true }
              );
            },
          },
        ],
        { variant: 'success' }
      );
    }
  } catch (error) {
    throw new Error('Could not create requisition: ', error || '');
  }
};

const Checkout = () => {
  const {
    drugRequisition,
    hydrated,
    updateQuantity,
    removeFromCart,
    updateRequisitionDetails,
    clearCart,
  } = useCart();
  const { theme: appTheme } = useTheme();
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [pharms, setPharms] = useState<ProfileFields[]>([]);
  const [loadingPharms, setLoadingPharms] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
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
      scroll: { padding: theme.spacing.base, gap: theme.spacing.base },

      // Requisition card
      card: {
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.base,
      },
      orderCaption: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.xs,
      },

      // Pharmacy header
      pharmRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingBottom: theme.spacing.base,
        marginBottom: theme.spacing.base,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
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
      pharmRetry: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '500',
        color: theme.colors.primary.deep,
        textDecorationLine: 'underline',
      },

      // Line items
      itemRow: {
        paddingVertical: theme.spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
      },
      itemRowFirst: { borderTopWidth: 0, paddingTop: 0 },
      itemTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: theme.spacing.sm,
      },
      itemName: {
        flex: 1,
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
      removeBtn: { padding: theme.spacing.xs },
      removeText: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },
      itemBottom: {
        marginTop: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
      },
      stepBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: theme.colors.primary.extraDeep,
        alignItems: 'center',
        justifyContent: 'center',
      },
      stepBtnDisabled: { opacity: 0.35 },
      stepBtnText: { color: theme.colors.buttonText, fontSize: 18 },
      stepNum: {
        minWidth: 24,
        textAlign: 'center',
        fontSize: theme.typography.sizes.base,
        fontWeight: '600',
        color: theme.colors.text,
      },
      lineTotal: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '600',
        color: theme.colors.text,
      },

      // Order summary
      summary: {
        marginTop: theme.spacing.base,
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
      subtotalLabel: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '600',
        color: theme.colors.text,
      },
      subtotalValue: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '600',
        color: theme.colors.text,
      },

      // Form
      formBlock: {
        marginTop: theme.spacing.base,
        paddingTop: theme.spacing.base,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
        gap: theme.spacing.md,
      },
      warningBox: {
        backgroundColor: theme.colors.warningBg,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
      },
      warningText: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.warning,
        lineHeight: 20,
      },
      label: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
      },
      input: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.text,
      },
      inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
      inputError: { borderColor: theme.colors.warning },
      errorText: {
        marginTop: theme.spacing.xs,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.warning,
      },

      // Sticky footer
      footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.base,
        paddingHorizontal: theme.spacing.base,
        paddingTop: theme.spacing.md,
        backgroundColor: theme.colors.background,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
      },
      footerTotal: { minWidth: 96 },
      footerTotalLabel: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },
      footerTotalValue: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: '600',
        color: theme.colors.text,
      },
      footerButton: { flex: 1 },
      appHeader: {
        paddingHorizontal: theme.spacing.base,
        marginBottom: 0,
      },
    })
  );

  // Fetch pharmacy profiles. Keyed on the *set* of pharmacy ids rather than the
  // whole cart, so changing a quantity doesn't trigger a refetch.
  const pharmKey = useMemo(
    () =>
      drugRequisition
        .map((r) => r.pharmacy_id)
        .sort()
        .join(','),
    [drugRequisition]
  );

  useEffect(() => {
    if (!token || !hydrated || !pharmKey) return;

    let cancelled = false;
    // let pharmKeys = pharmKey.split(',')
    const timeout = setTimeout(async () => {
      try {
        // if (Array.isArray(pharmKeys) && pharmKeys.length > 1)
        const res = await apiListProfiles(
          pharmKey.split(',').length > 1
            ? { ids: [...pharmKey.split(','), ''], role: 'pharmacy' }
            : { id: pharmKey, role: 'pharmacy' },
          token
        );
        console.log(res);
        if (!cancelled) setPharms(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoadingPharms(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [hydrated, token, pharmKey, retryKey]);

  const retryPharms = () => {
    setLoadingPharms(true);
    setRetryKey((k) => k + 1);
  };

  // `pharmacy_id` may match either the profile id or its user id.
  const findPharm = (pharmacyId: string): ProfileFields | undefined =>
    pharms.find((p) => p.id === pharmacyId || p.user_id === pharmacyId);

  // Order total for one pharmacy = items + that pharmacy's delivery cost.
  const orderTotalOf = (req: DrugReqData): number =>
    itemsTotalOf(req) + deliveryCostOf(findPharm(req.pharmacy_id));

  const grandTotal = drugRequisition.reduce((s, r) => s + orderTotalOf(r), 0);

  // Without a profile we can't know the delivery cost, so the total would be
  // wrong. Hold the order button until every pharmacy has loaded.
  const pharmsReady = drugRequisition.every((r) => !!findPharm(r.pharmacy_id));

  const errorsFor = (req: DrugReqData) => ({
    address: !req.delivery_address?.trim(),
    prescription: needsPrescription(req) && !req.prescription_id?.trim(),
  });

  const hasErrors = drugRequisition.some((r) => {
    const e = errorsFor(r);
    return e.address || e.prescription;
  });

  const handlePlaceOrder = async () => {
    setShowErrors(true);
    if (hasErrors || !pharmsReady || !token || !user?.id) return;

    setSubmitting(true);
    const failed: string[] = [];

    for (const req of drugRequisition) {
      try {
        await submitRequisition(
          {
            ...req,
            delivery_address: req.delivery_address?.trim() || null,
            notes: req.notes?.trim() || null,
            prescription_id: req.prescription_id?.trim() || null,
            patient_id: user?.id,
          },
          token
        );
        await clearCart(req.pharmacy_id); // only clear what actually went through
      } catch (error) {
        failed.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    setSubmitting(false);

    if (failed.length > 0) {
      AppAlert.alert(
        "Some orders didn't go through",
        `${failed[0]}\n\nThe affected items are still in your cart.`,
        [],
        { variant: 'error' }
      );
    }
  };

  // ---- States -------------------------------------------------------------

  if (!hydrated) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Checkout' }} />
        <ActivityIndicator
          style={{ flex: 1 }}
          color={appTheme.colors.primary.deep}
        />
      </View>
    );
  }

  if (drugRequisition.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Checkout' }} />
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyBody}>
            Add some drugs from a pharmacy to get started.
          </Text>
          <Button label="Browse pharmacies" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  // ---- Main ---------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Checkout' }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AppHeader title="Checkout" style={styles.appHeader} />
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {drugRequisition.map((req, index) => {
            const errors = errorsFor(req);
            const requiresRx = needsPrescription(req);
            const pharmacy = findPharm(req.pharmacy_id);
            const itemsTotal = itemsTotalOf(req);
            const delivery = deliveryCostOf(pharmacy);

            const deliveryLabel = pharmacy
              ? delivery > 0
                ? formatPrice(delivery)
                : 'Free'
              : loadingPharms
                ? 'Calculating…'
                : '—';

            return (
              <View key={req.pharmacy_id} style={styles.card}>
                {drugRequisition.length > 1 && (
                  <Text style={styles.orderCaption}>
                    Order {index + 1} of {drugRequisition.length}
                  </Text>
                )}

                {/* Pharmacy profile */}
                {pharmacy ? (
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
                      {typeof pharmacy.rating === 'number' &&
                      pharmacy.rating > 0 ? (
                        <Text style={styles.pharmMeta}>
                          ★ {pharmacy.rating.toFixed(1)}
                          {pharmacy.totalReviews
                            ? ` (${pharmacy.totalReviews})`
                            : ''}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ) : loadingPharms ? (
                  <View style={styles.pharmRow}>
                    <ActivityIndicator color={appTheme.colors.primary.deep} />
                    <Text style={styles.pharmMeta}>Loading pharmacy…</Text>
                  </View>
                ) : (
                  <View style={styles.pharmRow}>
                    <View style={styles.pharmInfo}>
                      <Text style={styles.pharmMeta}>
                        Couldnt load pharmacy details.
                      </Text>
                    </View>
                    <TouchableOpacity onPress={retryPharms}>
                      <Text style={styles.pharmRetry}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {req.items.map((item, i) => (
                  <View
                    key={item.pharmacy_drug_id}
                    style={[styles.itemRow, i === 0 && styles.itemRowFirst]}
                  >
                    <View style={styles.itemTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>
                          {item.medication_name}
                        </Text>
                        <Text style={styles.itemUnit}>
                          {formatPrice(item.unit_price)} each
                        </Text>
                        {item.requiresPrescription && (
                          <View style={styles.rxTag}>
                            <Text style={styles.rxTagText}>Rx only</Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        accessibilityLabel={`Remove ${item.medication_name}`}
                        style={styles.removeBtn}
                        onPress={() =>
                          removeFromCart({
                            data: toDrug(item),
                            pharmacyId: req.pharmacy_id,
                          })
                        }
                      >
                        <Text style={styles.removeText}>Remove</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.itemBottom}>
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          accessibilityLabel="Decrease quantity"
                          disabled={item.quantity <= 1}
                          style={[
                            styles.stepBtn,
                            item.quantity <= 1 && styles.stepBtnDisabled,
                          ]}
                          onPress={() =>
                            updateQuantity({
                              data: toDrug(item),
                              pharmacyId: req.pharmacy_id,
                              quantity: item.quantity - 1,
                            })
                          }
                        >
                          <Text style={styles.stepBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepNum}>{item.quantity}</Text>
                        <TouchableOpacity
                          accessibilityLabel="Increase quantity"
                          style={styles.stepBtn}
                          onPress={() =>
                            updateQuantity({
                              data: toDrug(item),
                              pharmacyId: req.pharmacy_id,
                              quantity: item.quantity + 1,
                            })
                          }
                        >
                          <Text style={styles.stepBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.lineTotal}>
                        {formatPrice(item.unit_price * item.quantity)}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Subtotal = items + this pharmacy's delivery cost */}
                <View style={styles.summary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Items</Text>
                    <Text style={styles.summaryValue}>
                      {formatPrice(itemsTotal)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery</Text>
                    <Text style={styles.summaryValue}>{deliveryLabel}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.subtotalLabel}>Subtotal</Text>
                    <Text style={styles.subtotalValue}>
                      {formatPrice(itemsTotal + delivery)}
                    </Text>
                  </View>
                </View>

                <View style={styles.formBlock}>
                  {requiresRx && (
                    <View style={styles.warningBox}>
                      <Text style={styles.warningText}>
                        ⚠️ This order includes prescription-only medication. The
                        pharmacy will check your prescription before dispensing.
                      </Text>
                    </View>
                  )}

                  {requiresRx && (
                    <View>
                      <Text style={styles.label}>Prescription ID</Text>
                      {/* TODO: replace with a prescription picker/upload */}
                      <TextInput
                        style={[
                          styles.input,
                          showErrors &&
                            errors.prescription &&
                            styles.inputError,
                        ]}
                        value={req.prescription_id ?? ''}
                        onChangeText={(text) =>
                          updateRequisitionDetails(req.pharmacy_id, {
                            prescription_id: text,
                          })
                        }
                        placeholder="Enter your prescription ID"
                        placeholderTextColor={appTheme.colors.textMuted}
                        autoCapitalize="none"
                      />
                      {showErrors && errors.prescription && (
                        <Text style={styles.errorText}>
                          A prescription is required for this order.
                        </Text>
                      )}
                    </View>
                  )}

                  <View>
                    <Text style={styles.label}>Delivery address</Text>
                    <TextInput
                      style={[
                        styles.input,
                        showErrors && errors.address && styles.inputError,
                      ]}
                      value={req.delivery_address ?? ''}
                      onChangeText={(text) =>
                        updateRequisitionDetails(req.pharmacy_id, {
                          delivery_address: text,
                        })
                      }
                      placeholder="Street, area, city"
                      placeholderTextColor={appTheme.colors.textMuted}
                      textContentType="fullStreetAddress"
                    />
                    {showErrors && errors.address && (
                      <Text style={styles.errorText}>
                        Enter where the order should be delivered.
                      </Text>
                    )}
                  </View>

                  <View>
                    <Text style={styles.label}>
                      Note to pharmacy (optional)
                    </Text>
                    <TextInput
                      style={[styles.input, styles.inputMultiline]}
                      value={req.notes ?? ''}
                      onChangeText={(text) =>
                        updateRequisitionDetails(req.pharmacy_id, {
                          notes: text,
                        })
                      }
                      placeholder="Allergies, delivery instructions…"
                      placeholderTextColor={appTheme.colors.textMuted}
                      multiline
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 75) },
          ]}
        >
          <View style={styles.footerTotal}>
            <Text style={styles.footerTotalLabel}>Total</Text>
            <Text style={styles.footerTotalValue}>
              {pharmsReady ? formatPrice(grandTotal) : '—'}
            </Text>
          </View>
          <Button
            label={submitting ? 'Placing order…' : 'Place order'}
            onPress={handlePlaceOrder}
            disabled={submitting || !pharmsReady}
            style={styles.footerButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Checkout;
