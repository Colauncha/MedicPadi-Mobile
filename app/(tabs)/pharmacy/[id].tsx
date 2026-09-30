import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { apiGetDrugById, DrugData } from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';

const formatPrice = (price: number): string =>
  `₦${price.toLocaleString('en-NG')}`;

export default function DrugDetailsScreen() {
  const { id: drugId, name: drugName } = useLocalSearchParams<{
    id: string;
    name?: string;
  }>();
  const { token } = useAuth();
  const { theme: appTheme } = useTheme();
  const [drug, setDrug] = useState<DrugData | null>(null);
  const [loading, setLoading] = useState(!!drugId);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!drugId || !token) return;
    apiGetDrugById(drugId, token)
      .then(setDrug)
      .catch(() => setDrug(null))
      .finally(() => setLoading(false));
  }, [drugId, token]);

  const displayName = drug ? drug.name : (drugName ?? 'Drug');
  const displayPrice = drug ? formatPrice(drug.price) : '—';

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      scroll: { padding: theme.spacing.base, paddingBottom: 100 },
      imageBox: {
        backgroundColor: theme.colors.primary.shallow,
        borderRadius: theme.radius.lg,
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.base,
        overflow: 'hidden',
      },
      image: { width: '100%', height: '100%' },
      imagePlaceholderText: { fontSize: 80 },
      infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
      },
      drugName: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '500',
        color: theme.colors.text,
        flex: 1,
        marginRight: theme.spacing.sm,
      },
      drugPrice: {
        fontSize: theme.typography.sizes.base,
        color: theme.colors.text,
      },
      metaRow: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.base,
      },
      categoryText: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textMuted,
      },
      quantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.base,
        marginBottom: theme.spacing.base,
      },
      quantityBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary.extraDeep,
        alignItems: 'center',
        justifyContent: 'center',
      },
      quantityBtnText: { color: theme.colors.buttonText, fontSize: 20 },
      quantityNum: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: '500',
        color: theme.colors.text,
        minWidth: 30,
        textAlign: 'center',
      },
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
      section: { marginBottom: theme.spacing.base },
      sectionTitle: {
        fontSize: theme.typography.sizes.base,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
      },
      bodyText: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
        lineHeight: 18,
      },
      orderBtn: { marginTop: theme.spacing.base },
    })
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `About ${displayName}` }} />
      {loading ? (
        <ActivityIndicator
          style={{ flex: 1 }}
          color={appTheme.colors.primary.deep}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.imageBox}>
            {drug?.imageUrl ? (
              <Image
                source={{ uri: drug.imageUrl }}
                style={styles.image}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.imagePlaceholderText}>💊</Text>
            )}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.drugName}>{displayName}</Text>
            <Text style={styles.drugPrice}>{displayPrice}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.categoryText}>
              {drug?.category?.name ??
                (drug?.requiresPrescription
                  ? 'Prescription'
                  : 'Over-the-counter')}
            </Text>
          </View>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Text style={styles.quantityBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantityNum}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Text style={styles.quantityBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          {drug?.requiresPrescription && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ This medication requires a valid prescription. Consult your
                doctor before purchasing.
              </Text>
            </View>
          )}
          {drug?.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this drug</Text>
              <Text style={styles.bodyText}>{drug.description}</Text>
            </View>
          ) : null}
          {drug?.dosage ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dosage and Usage</Text>
              <Text style={styles.bodyText}>{drug.dosage}</Text>
            </View>
          ) : null}
          {drug?.composition ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Composition</Text>
              <Text style={styles.bodyText}>{drug.composition}</Text>
            </View>
          ) : null}
          {/* TODO: wire up once a cart exists */}
          <Button
            label="Add to Cart"
            onPress={() => {}}
            style={styles.orderBtn}
          />
        </ScrollView>
      )}
    </View>
  );
}
