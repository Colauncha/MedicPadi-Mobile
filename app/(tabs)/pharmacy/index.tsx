import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
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
import {
  apiGetDrugs,
  apiListProfiles,
  DrugData,
  ProfileFields,
} from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';

const formatPrice = (price: number): string =>
  `₦${price.toLocaleString('en-NG')}`;

export default function PharmacyScreen() {
  const { token } = useAuth();
  const { theme: appTheme } = useTheme();
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
        setDrugs(
          Array.isArray(drugsRes.value.data) ? drugsRes.value.data : []
        );
      }
      if (pharmaRes.status === 'fulfilled') {
        setPharmacies(
          Array.isArray(pharmaRes.value.data) ? pharmaRes.value.data : []
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const timeoutId = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [token, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const query = search.trim().toLowerCase();
  const filteredDrugs = query
    ? drugs.filter((d) => d.name.toLowerCase().includes(query))
    : drugs;
  const filteredPharmacies = query
    ? pharmacies.filter((p) => (p.name ?? '').toLowerCase().includes(query))
    : pharmacies;

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
      cartIcon: { fontSize: 24 },
      scroll: { padding: theme.spacing.base, paddingBottom: 100 },
      searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.lg,
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.xl,
        height: 44,
        gap: theme.spacing.sm,
      },
      searchInput: {
        flex: 1,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.text,
      },
      section: { marginBottom: theme.spacing.xl },
      sectionTitle: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '500',
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
      },
      emptyText: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginTop: theme.spacing.md,
      },
      pharmacyCard: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
      },
      pharmacyImage: {
        width: 60,
        height: 60,
        borderRadius: theme.radius.md,
      },
      pharmacyInfo: { flex: 1, justifyContent: 'center' },
      pharmacyName: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '500',
        color: theme.colors.text,
        marginBottom: 2,
      },
      pharmacyLocation: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },
      drugsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
      },
      drugCard: {
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        width: '47%',
      },
      drugImage: {
        width: '100%',
        height: 80,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.primary.shallow,
        marginBottom: theme.spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
      },
      drugName: {
        fontSize: theme.typography.sizes.md,
        fontWeight: '500',
        color: theme.colors.text,
        marginBottom: 2,
      },
      drugCategory: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.xs,
      },
      drugPrice: {
        fontSize: theme.typography.sizes.md,
        fontWeight: '500',
        color: theme.colors.primary.mid,
      },
    })
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Pharmacy</Text>
        <TouchableOpacity>
          <Text style={styles.cartIcon}>🛒</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.searchBox}>
            <IconSymbol
              name="magnifyingglass"
              size={18}
              color={appTheme.colors.textMuted}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search drugs, pharmacies..."
              placeholderTextColor={appTheme.colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {loading ? (
            <ActivityIndicator
              color={appTheme.colors.primary.deep}
              style={{ marginTop: 40 }}
            />
          ) : (
            <>
              {filteredPharmacies.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pharmacies</Text>
                  {filteredPharmacies.map((pharmacy) => (
                    <View
                      key={pharmacy.id ?? pharmacy.user_id}
                      style={styles.pharmacyCard}
                    >
                      {pharmacy.profilePicture?.url ? (
                        <Image
                          source={{ uri: pharmacy.profilePicture.url }}
                          style={styles.pharmacyImage}
                          contentFit="cover"
                        />
                      ) : (
                        <AvatarFromString
                          input={pharmacy.name || 'Pharmacy'}
                          size={60}
                        />
                      )}
                      <View style={styles.pharmacyInfo}>
                        <Text style={styles.pharmacyName}>
                          {pharmacy.name ?? 'Pharmacy'}
                        </Text>
                        <Text style={styles.pharmacyLocation}>
                          {pharmacy.address ?? ''}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {query ? 'Search Results' : 'Available Drugs'}
                </Text>
                {filteredDrugs.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {query
                      ? 'No drugs match your search'
                      : 'No drugs available'}
                  </Text>
                ) : (
                  <View style={styles.drugsGrid}>
                    {filteredDrugs.map((drug) => (
                      <TouchableOpacity
                        key={drug.id}
                        style={styles.drugCard}
                        onPress={() =>
                          router.push({
                            pathname: '/pharmacy/[id]',
                            params: { id: drug.id, name: drug.name },
                          })
                        }
                      >
                        <View style={styles.drugImage}>
                          {drug.imageUrl ? (
                            <Image
                              source={{ uri: drug.imageUrl }}
                              style={{ width: '100%', height: '100%' }}
                              contentFit="cover"
                            />
                          ) : (
                            <IconSymbol
                              name="pill.fill"
                              size={32}
                              color={appTheme.colors.primary.mid}
                            />
                          )}
                        </View>
                        <Text style={styles.drugName} numberOfLines={2}>
                          {drug.name}
                        </Text>
                        <Text style={styles.drugCategory} numberOfLines={1}>
                          {drug.category?.name ??
                            (drug.requiresPrescription
                              ? 'Prescription'
                              : 'OTC')}
                        </Text>
                        <Text style={styles.drugPrice}>
                          {formatPrice(drug.price)}
                        </Text>
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
}
