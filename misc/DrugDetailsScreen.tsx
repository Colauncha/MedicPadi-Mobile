import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { PatientStackParamList } from '../../navigation/types';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { colors, typography, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { DrugData, apiGetDrugById } from '../../services/api';

type RouteProps = RouteProp<PatientStackParamList, 'DrugDetails'>;

const formatPrice = (price: number): string => `₦${price.toLocaleString('en-NG')}`;

export const DrugDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const { drugName, drugId } = route.params ?? {};
  const { token } = useAuth();
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

  const displayName = drug ? drug.name : drugName ?? 'Drug';
  const displayPrice = drug ? formatPrice(drug.price) : '—';

  return (
    <SafeAreaView style={styles.container}>
      <Header title={`About ${displayName}`} />
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary[950]} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Drug image */}
          <View style={styles.imageBox}>
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>💊</Text>
            </View>
            <View style={styles.paginationDots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.drugName}>{displayName}</Text>
            <Text style={styles.drugPrice}>{displayPrice}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.categoryText}>
              {drug?.category?.name ?? (drug?.requiresPrescription ? 'Prescription' : 'Over-the-counter')}
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
            <TouchableOpacity style={styles.quantityBtn} onPress={() => setQuantity(quantity + 1)}>
              <Text style={styles.quantityBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          {drug?.requiresPrescription && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ This medication requires a valid prescription. Consult your doctor before purchasing.
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
          <Button label="Add to Cart" onPress={() => {}} style={styles.orderBtn} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.base, paddingBottom: 40 },
  imageBox: {
    backgroundColor: colors.cardBlue,
    borderRadius: radius.lg,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  imagePlaceholder: { alignItems: 'center' },
  imagePlaceholderText: { fontSize: 80 },
  paginationDots: { flexDirection: 'row', gap: 6, marginTop: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text.muted },
  dotActive: { backgroundColor: colors.primary[950] },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  drugName: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    flex: 1,
    marginRight: spacing.sm,
  },
  drugPrice: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  categoryText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.text.muted,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginBottom: spacing.base,
  },
  quantityBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[950],
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityBtnText: { color: colors.text.white, fontSize: 20 },
  quantityNum: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.lg,
    color: colors.text.dark,
    minWidth: 30,
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#ffedc6',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  warningText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: '#6b4f00',
    lineHeight: 20,
  },
  section: { marginBottom: spacing.base },
  sectionTitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: '#454545',
    marginBottom: spacing.sm,
  },
  bodyText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.text.light,
    lineHeight: 18,
  },
  orderBtn: { marginTop: spacing.base },
});
