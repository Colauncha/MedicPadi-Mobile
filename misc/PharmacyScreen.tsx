import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../navigation/types';
import { colors, typography, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import {
  DrugData,
  ProfileFields,
  apiGetDrugs,
  apiListProfiles,
} from '../../services/api';

type Nav = NativeStackNavigationProp<PatientStackParamList>;

const formatPrice = (price: number): string =>
  `₦${price.toLocaleString('en-NG')}`;

export const PharmacyScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { token } = useAuth();
  const [drugs, setDrugs] = useState<DrugData[]>([]);
  const [pharmacies, setPharmacies] = useState<ProfileFields[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [drugsRes, pharmaRes] = await Promise.allSettled([
        apiGetDrugs({ limit: 20 }, token),
        apiListProfiles({ role: 'pharmacy', limit: 10 }, token),
      ]);
      if (drugsRes.status === 'fulfilled') {
        setDrugs(Array.isArray(drugsRes.value.data) ? drugsRes.value.data : []);
      }
      if (pharmaRes.status === 'fulfilled') {
        setPharmacies(Array.isArray(pharmaRes.value.data) ? pharmaRes.value.data : []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredDrugs = search.trim()
    ? drugs.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    : drugs;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pharmacy</Text>
        <TouchableOpacity>
          <Text style={styles.cartIcon}>🛒</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
      >
        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search drugs, pharmacies..."
            placeholderTextColor={colors.text.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {loading ? (
          <ActivityIndicator color={colors.primary[950]} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Pharmacies */}
            {pharmacies.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Pharmacies</Text>
                </View>
                {pharmacies.map((pharmacy) => (
                  <TouchableOpacity key={pharmacy.id ?? pharmacy.user_id} style={styles.pharmacyCard}>
                    <View style={styles.pharmacyImage} />
                    <View style={styles.pharmacyInfo}>
                      <Text style={styles.pharmacyName}>{pharmacy.name ?? 'Pharmacy'}</Text>
                      <Text style={styles.pharmacyLocation}>{pharmacy.address ?? ''}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {search.trim() ? 'Search Results' : 'Available Drugs'}
              </Text>
              {filteredDrugs.length === 0 ? (
                <Text style={styles.emptyText}>
                  {search.trim() ? 'No drugs match your search' : 'No drugs available'}
                </Text>
              ) : (
                <View style={styles.drugsGrid}>
                  {filteredDrugs.map((drug) => (
                    <TouchableOpacity
                      key={drug.id}
                      style={styles.drugCard}
                      onPress={() =>
                        navigation.navigate('DrugDetails', {
                          drugName: drug.name,
                          drugId: drug.id,
                        })
                      }
                    >
                      <View style={styles.drugImage} />
                      <Text style={styles.drugName} numberOfLines={2}>{drug.name}</Text>
                      <Text style={styles.drugCategory} numberOfLines={1}>
                        {drug.category?.name ?? (drug.requiresPrescription ? 'Prescription' : 'OTC')}
                      </Text>
                      <Text style={styles.drugPrice}>{formatPrice(drug.price)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.lg,
    color: colors.text.dark,
  },
  cartIcon: { fontSize: 24 },
  scroll: { padding: spacing.base, paddingBottom: 40 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
    height: 44,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
  },
  section: { marginBottom: spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.medium,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.text.light,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  pharmacyCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pharmacyImage: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.cardBlue,
  },
  pharmacyInfo: { flex: 1, justifyContent: 'center' },
  pharmacyName: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    marginBottom: 2,
  },
  pharmacyLocation: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  drugsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  drugCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: '47%',
  },
  drugImage: {
    width: '100%',
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.cardBlue,
    marginBottom: spacing.sm,
  },
  drugName: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
    marginBottom: 2,
  },
  drugCategory: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  drugPrice: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.primary[800],
  },
});
