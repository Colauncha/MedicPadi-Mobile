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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../navigation/types';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { colors, typography, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { LabTestData, apiGetLabTests } from '../../services/api';

type Nav = NativeStackNavigationProp<PatientStackParamList>;

const formatPrice = (price: number): string => `₦${price.toLocaleString('en-NG')}`;

export const LabTestScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { token } = useAuth();
  const [tests, setTests] = useState<LabTestData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTests = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiGetLabTests({ limit: 50 }, token);
      setTests(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const filtered = search.trim()
    ? tests.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : tests;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Header title="Available Tests" showBack />
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search lab tests..."
            placeholderTextColor={colors.text.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary[950]} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTests(); }} />}
        >
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>
              {search.trim() ? 'No tests match your search' : 'No lab tests available'}
            </Text>
          ) : (
            filtered.map((test) => (
              <View key={test.id} style={styles.testCard}>
                <View style={styles.testInfo}>
                  <Text style={styles.testName}>{test.name}</Text>
                  {test.department?.name ? (
                    <Text style={styles.testLab}>{test.department.name}</Text>
                  ) : null}
                  <View style={styles.testMeta}>
                    {test.TAT ? (
                      <Text style={styles.testDuration}>⏱ {test.TAT}</Text>
                    ) : null}
                    <Text style={styles.testPrice}>{formatPrice(test.price)}</Text>
                  </View>
                  {test.available === false && (
                    <Text style={styles.unavailableText}>Currently unavailable</Text>
                  )}
                </View>
                <Button
                  label="Book"
                  onPress={() => navigation.navigate('BookAppointment', {})}
                  size="sm"
                  style={styles.bookBtn}
                  disabled={test.available === false}
                />
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  filterBtn: { paddingRight: spacing.base },
  filterIcon: { fontSize: 20 },
  searchRow: { paddingHorizontal: spacing.base, marginBottom: spacing.base },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
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
  scroll: { paddingHorizontal: spacing.base, paddingBottom: 40, gap: spacing.md },
  emptyText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.text.light,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.md,
  },
  testInfo: { flex: 1 },
  testName: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
    marginBottom: 2,
  },
  testLab: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginBottom: spacing.xs,
  },
  testMeta: { flexDirection: 'row', gap: spacing.md },
  testDuration: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
  },
  testPrice: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.primary[800],
  },
  unavailableText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.danger,
    marginTop: 2,
  },
  bookBtn: { minWidth: 80 },
});
