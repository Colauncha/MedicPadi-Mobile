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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { apiGetLabTests, LabTestData } from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';

const formatPrice = (price: number): string =>
  `₦${price.toLocaleString('en-NG')}`;

export default function LabTestScreen() {
  const { token } = useAuth();
  const { theme: appTheme } = useTheme();
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
    if (!token) return;

    const timeoutId = setTimeout(() => {
      void loadTests();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [token, loadTests]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTests();
  };

  const query = search.trim().toLowerCase();
  const filtered = query
    ? tests.filter((t) => t.name.toLowerCase().includes(query))
    : tests;

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      header: {
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
      searchRow: {
        paddingHorizontal: theme.spacing.base,
        marginBottom: theme.spacing.base,
      },
      searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.lg,
        paddingHorizontal: theme.spacing.md,
        height: 44,
        gap: theme.spacing.sm,
      },
      searchInput: {
        flex: 1,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.text,
      },
      scroll: {
        paddingHorizontal: theme.spacing.base,
        paddingBottom: 100,
        gap: theme.spacing.md,
      },
      emptyText: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
      },
      testCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.base,
        gap: theme.spacing.md,
      },
      testInfo: { flex: 1 },
      testName: {
        fontSize: theme.typography.sizes.md,
        fontWeight: '500',
        color: theme.colors.text,
        marginBottom: 2,
      },
      testLab: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
      },
      testMeta: { flexDirection: 'row', gap: theme.spacing.md },
      testDuration: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },
      testPrice: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '500',
        color: theme.colors.primary.mid,
      },
      unavailableText: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.danger,
        marginTop: 2,
      },
      bookBtn: { minWidth: 80 },
    })
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Tests</Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <IconSymbol
              name="magnifyingglass"
              size={18}
              color={appTheme.colors.textMuted}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search lab tests..."
              placeholderTextColor={appTheme.colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
        {loading ? (
          <ActivityIndicator
            style={{ marginTop: 40 }}
            color={appTheme.colors.primary.deep}
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {filtered.length === 0 ? (
              <Text style={styles.emptyText}>
                {query ? 'No tests match your search' : 'No lab tests available'}
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
                      <Text style={styles.testPrice}>
                        {formatPrice(test.price)}
                      </Text>
                    </View>
                    {test.available === false && (
                      <Text style={styles.unavailableText}>
                        Currently unavailable
                      </Text>
                    )}
                  </View>
                  <Button
                    label="Book"
                    onPress={() => router.push('/appointments/book')}
                    size="sm"
                    style={styles.bookBtn}
                    disabled={test.available === false}
                  />
                </View>
              ))
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
