import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { apiGetDrugById, DrugData } from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';
import { useCart } from '@/context/CartContext';
import { AppAlert } from '@/components/ui/alert';

const LOW_STOCK_THRESHOLD = 5;

const formatPrice = (price: number): string =>
  `₦${price.toLocaleString('en-NG')}`;

// "Nausea, headache; dizziness" -> ['Nausea', 'headache', 'dizziness']
const splitList = (value?: string): string[] =>
  (value ?? '')
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

export default function DrugDetailsScreen() {
  const { id: drugId, name: drugName } = useLocalSearchParams<{
    id: string;
    name?: string;
  }>();
  const { token } = useAuth();
  const { theme: appTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [drug, setDrug] = useState<DrugData | null>(null);
  const [loading, setLoading] = useState(!!drugId);
  const [failed, setFailed] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const { addToCart } = useCart();

  useEffect(() => {
    if (!drugId || !token) return;
    apiGetDrugById(drugId, token)
      .then(setDrug)
      .catch(() => {
        setFailed(true);
        setDrug(null);
      })
      .finally(() => setLoading(false));
  }, [drugId, token]);

  const displayName = drug ? drug.name : (drugName ?? 'Drug');

  // Availability: `available` defaults to true when not provided,
  // `stock === null` means stock isn't tracked, so don't block on it.
  const outOfStock = drug?.stock === 0;
  const unavailable = drug?.available === false || outOfStock;
  const maxQuantity = drug?.stock ?? Infinity;
  const lowStock =
    !unavailable &&
    typeof drug?.stock === 'number' &&
    drug.stock <= LOW_STOCK_THRESHOLD;

  const stockLabel = outOfStock
    ? 'Out of stock'
    : drug?.available === false
      ? 'Currently unavailable'
      : lowStock
        ? `Only ${drug?.stock} left`
        : drug
          ? 'In stock'
          : null;

  const total = drug ? drug.price * quantity : 0;

  const sideEffects = useMemo(() => splitList(drug?.sideEffect), [drug]);
  const showSideEffectChips =
    sideEffects.length > 1 &&
    sideEffects.length <= 10 &&
    sideEffects.every((s) => s.length <= 40);

  const openMedSite = async () => {
    if (!drug?.linkToMedWebsite) return;
    try {
      await Linking.openURL(drug.linkToMedWebsite);
    } catch {
      // Ignore: bad or unsupported URL
    }
  };

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      scroll: { padding: theme.spacing.base, paddingBottom: 140 },
      center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.base,
      },
      errorTitle: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
        textAlign: 'center',
      },
      errorBody: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        textAlign: 'center',
      },

      // Hero
      imageBox: {
        backgroundColor: theme.colors.primary.shallow,
        borderRadius: theme.radius.lg,
        height: 220,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.base,
        overflow: 'hidden',
      },
      image: { width: '100%', height: '100%' },
      imagePlaceholderText: { fontSize: 80 },
      imageDim: { opacity: 0.45 },
      rxBadge: {
        position: 'absolute',
        top: theme.spacing.md,
        left: theme.spacing.md,
        backgroundColor: theme.colors.warningBg,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
      },
      rxBadgeText: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '600',
        color: theme.colors.warning,
      },

      // Title block
      titleBlock: { marginBottom: theme.spacing.base },
      category: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.xs,
      },
      drugName: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
      },
      priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      drugPrice: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: '600',
        color: theme.colors.primary.extraDeep,
      },
      statusPill: {
        borderRadius: 999,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        backgroundColor: theme.colors.primary.shallow,
      },
      statusPillWarn: { backgroundColor: theme.colors.warningBg },
      statusText: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '500',
        color: theme.colors.primary.extraDeep,
      },
      statusTextWarn: { color: theme.colors.warning },

      // Quantity
      quantityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.primary.shallow,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.base,
      },
      quantityLabel: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
      },
      quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.base,
      },
      quantityBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary.extraDeep,
        alignItems: 'center',
        justifyContent: 'center',
      },
      quantityBtnDisabled: { opacity: 0.35 },
      quantityBtnText: { color: theme.colors.buttonText, fontSize: 20 },
      quantityNum: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: '600',
        color: theme.colors.text,
        minWidth: 30,
        textAlign: 'center',
      },

      // Content
      warningBox: {
        backgroundColor: theme.colors.warningBg,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.base,
      },
      warningText: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.warning,
        lineHeight: 20,
      },
      section: {
        paddingTop: theme.spacing.base,
        marginTop: theme.spacing.base,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.primary.shallow,
      },
      sectionFirst: {
        marginTop: 0,
        paddingTop: 0,
        borderTopWidth: 0,
      },
      sectionTitle: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
      },
      bodyText: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
        lineHeight: 21,
      },
      chipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
      },
      chip: {
        backgroundColor: theme.colors.primary.shallow,
        borderRadius: 999,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
      },
      chipText: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
      },
      linkRow: {
        marginTop: theme.spacing.base,
        paddingVertical: theme.spacing.md,
      },
      linkText: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '500',
        color: theme.colors.primary.deep,
        textDecorationLine: 'underline',
      },

      // Sticky footer
      footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.base,
        paddingHorizontal: theme.spacing.base,
        paddingTop: theme.spacing.md,
        backgroundColor: theme.colors.background,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.primary.shallow,
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
    })
  );

  const handleAddToCart = async () => {
    if (!drug || !drug.user_id) return;

    try {
      await addToCart({
        data: drug,
        pharmacyId: drug.user_id || '',
        quantity,
      });
      AppAlert.alert(
        'Add to cart',
        `${quantity} units of ${drug.name} as been added to your cart`
      );
    } catch (error) {
      AppAlert.alert(
        'Error adding to cart',
        `The following error occured while adding to cart: ${error}`
      );
    }
  };

  const renderBody = () => {
    if (loading) {
      return (
        <ActivityIndicator
          style={{ flex: 1 }}
          color={appTheme.colors.primary.deep}
        />
      );
    }

    if (!drug) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>
            {failed ? "Couldn't load this drug" : 'Drug not found'}
          </Text>
          <Text style={styles.errorBody}>
            {failed
              ? 'Check your connection and go back to try again.'
              : 'It may have been removed from the catalogue.'}
          </Text>
        </View>
      );
    }

    return (
      <>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: 120 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.imageBox}>
            {drug.drugImage?.url ? (
              <Image
                source={{ uri: drug.drugImage.url }}
                style={[styles.image, unavailable && styles.imageDim]}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <Text style={styles.imagePlaceholderText}>💊</Text>
            )}
            {drug.requiresPrescription && (
              <View style={styles.rxBadge}>
                <Text style={styles.rxBadgeText}>Rx only</Text>
              </View>
            )}
          </View>

          {/* Title, price, availability */}
          <View style={styles.titleBlock}>
            {drug.category?.name ? (
              <Text style={styles.category}>{drug.category.name}</Text>
            ) : null}
            <Text style={styles.drugName}>{displayName}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.drugPrice}>{formatPrice(drug.price)}</Text>
              {stockLabel ? (
                <View
                  style={[
                    styles.statusPill,
                    (unavailable || lowStock) && styles.statusPillWarn,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      (unavailable || lowStock) && styles.statusTextWarn,
                    ]}
                  >
                    {stockLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Quantity */}
          {!unavailable && (
            <View style={styles.quantityCard}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  accessibilityLabel="Decrease quantity"
                  disabled={quantity <= 1}
                  style={[
                    styles.quantityBtn,
                    quantity <= 1 && styles.quantityBtnDisabled,
                  ]}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Text style={styles.quantityBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.quantityNum}>{quantity}</Text>
                <TouchableOpacity
                  accessibilityLabel="Increase quantity"
                  disabled={quantity >= maxQuantity}
                  style={[
                    styles.quantityBtn,
                    quantity >= maxQuantity && styles.quantityBtnDisabled,
                  ]}
                  onPress={() =>
                    setQuantity((q) => Math.min(maxQuantity, q + 1))
                  }
                >
                  <Text style={styles.quantityBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Prescription notice */}
          {drug.requiresPrescription && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ This medication requires a valid prescription. Consult your
                doctor before purchasing.
              </Text>
            </View>
          )}

          {/* Details */}
          {drug.description ? (
            <View style={[styles.section, styles.sectionFirst]}>
              <Text style={styles.sectionTitle}>About this drug</Text>
              <Text style={styles.bodyText}>{drug.description}</Text>
            </View>
          ) : null}

          {drug.dosage ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dosage and usage</Text>
              <Text style={styles.bodyText}>{drug.dosage}</Text>
            </View>
          ) : null}

          {drug.composition ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Composition</Text>
              <Text style={styles.bodyText}>{drug.composition}</Text>
            </View>
          ) : null}

          {drug.sideEffect ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Side effects</Text>
              {showSideEffectChips ? (
                <View style={styles.chipWrap}>
                  {sideEffects.map((effect) => (
                    <View key={effect} style={styles.chip}>
                      <Text style={styles.chipText}>{effect}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.bodyText}>{drug.sideEffect}</Text>
              )}
            </View>
          ) : null}

          {drug.linkToMedWebsite ? (
            <TouchableOpacity
              accessibilityRole="link"
              style={styles.linkRow}
              onPress={openMedSite}
            >
              <Text style={styles.linkText}>
                Read the full medical information
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>

        {/* Sticky purchase bar */}
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 75) },
          ]}
        >
          {!unavailable && (
            <View style={styles.footerTotal}>
              <Text style={styles.footerTotalLabel}>Total</Text>
              <Text style={styles.footerTotalValue}>{formatPrice(total)}</Text>
            </View>
          )}
          <Button
            label={unavailable ? (stockLabel ?? 'Unavailable') : 'Add to Cart'}
            // TODO: wire up once a cart exists
            onPress={handleAddToCart}
            // onPress={() => {}}
            disabled={unavailable}
            style={styles.footerButton}
          />
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `About ${displayName}` }} />
      {renderBody()}
    </View>
  );
}
