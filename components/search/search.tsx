import { useThemedStyles } from '@/hooks/useThemedStyle';
import { useTheme } from '@/theme/ThemeProvider';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol, IconSymbolName } from '../ui/icon-symbol';
import { useEffect, useState } from 'react';
import { apiSearch, SearchResults } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const SEARCH_DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 3;
const RESULTS_PER_TYPE = 5;

const formatPrice = (price: number) => `₦${price.toLocaleString('en-NG')}`;

interface ResultItem {
  key: string;
  title: string;
  subtitle?: string;
  pictureUrl?: string;
  onPress?: () => void;
}

interface ResultSection {
  title: string;
  icon: IconSymbolName;
  items: ResultItem[];
}

interface SearchProps {
  /** Called before navigating to a result, so the host (e.g. a modal) can close. */
  onSelect?: () => void;
}

const Search = ({ onSelect }: SearchProps) => {
  const { token } = useAuth();
  const { theme: appTheme } = useTheme();
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  // Tagged with the query it answers, so loading state can be derived instead
  // of set synchronously inside the effect.
  const [response, setResponse] = useState<{
    query: string;
    results: SearchResults | null;
    error: string | null;
  } | null>(null);

  // Only commit the query once the user stops typing for SEARCH_DEBOUNCE_MS.
  // The cleanup cancels the pending timer on every keystroke (and on unmount).
  useEffect(() => {
    const timeoutId = setTimeout(
      () => setDebouncedQ(q.trim()),
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(timeoutId);
  }, [q]);

  const canSearch = !!token && debouncedQ.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!canSearch) return;

    // Ignore responses that arrive after the query has changed or we unmounted,
    // so a slow earlier request can't overwrite newer results.
    let ignore = false;

    apiSearch({ q: debouncedQ, limit: RESULTS_PER_TYPE }, token)
      .then((results) => {
        if (!ignore) setResponse({ query: debouncedQ, results, error: null });
      })
      .catch((e: Error) => {
        if (!ignore) {
          setResponse({
            query: debouncedQ,
            results: null,
            error: e.message || 'Search failed',
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [canSearch, debouncedQ, token]);

  // Keep showing the previous results while a newer query is in flight.
  const results = response?.results ?? null;
  const error = response?.query === debouncedQ ? response.error : null;

  const go = (navigate: () => void) => () => {
    onSelect?.();
    navigate();
  };

  const sections: ResultSection[] = results
    ? [
        {
          title: 'Doctors',
          icon: 'stethoscope' as IconSymbolName,
          items: (results.doctors?.data ?? []).map((doc) => ({
            key: doc.id ?? doc.user_id ?? '',
            title: `Dr. ${doc.firstName ?? ''} ${doc.lastName ?? ''}`.trim(),
            subtitle: doc.speciality ?? 'General Practitioner',
            pictureUrl: doc.profilePicture?.url,
            onPress: doc.user_id
              ? go(() =>
                  router.push(
                    {
                      pathname: '/appointments/doctor/[id]',
                      params: { id: doc.user_id! },
                    },
                    { withAnchor: true }
                  )
                )
              : undefined,
          })),
        },
        {
          title: 'Pharmacies',
          icon: 'pill.fill' as IconSymbolName,
          items: (results.pharmacies?.data ?? []).map((pharm) => ({
            key: pharm.id ?? pharm.user_id ?? '',
            title: pharm.name ?? 'Pharmacy',
            subtitle: pharm.address,
            pictureUrl: pharm.profilePicture?.url,
            onPress: pharm.user_id
              ? go(() =>
                  router.push(
                    {
                      pathname: '/pharmacy/[id]',
                      params: { id: pharm.user_id! },
                    },
                    { withAnchor: true }
                  )
                )
              : undefined,
          })),
        },
        {
          title: 'Laboratories',
          icon: 'flask.fill' as IconSymbolName,
          items: (results.laboratories?.data ?? []).map((lab) => ({
            key: lab.id ?? lab.user_id ?? '',
            title: lab.name ?? 'Laboratory',
            subtitle: lab.address,
            pictureUrl: lab.profilePicture?.url,
            onPress: lab.user_id
              ? go(() =>
                  router.push(
                    {
                      pathname: '/lab/[id]',
                      params: { id: lab.user_id! },
                    },
                    { withAnchor: true }
                  )
                )
              : undefined,
          })),
        },
        {
          title: 'Drugs',
          icon: 'pill.fill' as IconSymbolName,
          items: (results.drugs?.data ?? []).map((drug) => ({
            key: drug.id,
            title: drug.name,
            subtitle: [drug.category?.name, formatPrice(drug.price)]
              .filter(Boolean)
              .join(' · '),
            pictureUrl: drug.imageUrl,
            onPress: go(() =>
              router.push(
                {
                  pathname: '/pharmacy/drug/[id]',
                  params: { id: drug.id, name: drug.name },
                },
                { withAnchor: true }
              )
            ),
          })),
        },
        {
          title: 'Lab Tests',
          icon: 'flask.fill' as IconSymbolName,
          items: (results.labTests?.data ?? []).map((test) => {
            const labId = test.lab?.user_id ?? test.lab_id;
            return {
              key: test.id,
              title: test.name,
              subtitle: [test.lab?.name, formatPrice(test.price)]
                .filter(Boolean)
                .join(' · '),
              onPress: labId
                ? go(() =>
                    router.push(
                      {
                        pathname: '/lab/[id]',
                        params: { id: labId },
                      },
                      { withAnchor: true }
                    )
                  )
                : undefined,
            };
          }),
        },
      ].filter((s) => s.items.length > 0)
    : [];

  const styles = useThemedStyles((t) =>
    StyleSheet.create({
      container: {
        maxHeight: 480,
        minHeight: 200,
      },
      search: {
        flexDirection: 'row',
        paddingHorizontal: t.spacing.md,
        alignItems: 'center',
        gap: t.spacing.sm,
        borderWidth: 1,
        borderColor: t.colors.border,
        marginVertical: t.spacing.sm,
        borderRadius: t.radius.xl,
        height: 40,
      },
      searchInput: {
        flex: 1,
        height: '100%',
        color: t.colors.text,
        fontFamily: t.typography.fonts?.sans,
        fontSize: t.typography.sizes.sm,
      },
      scroll: {
        paddingBottom: t.spacing.base,
      },
      status: {
        alignItems: 'center',
        paddingVertical: t.spacing.xl,
        gap: t.spacing.sm,
      },
      statusText: {
        color: t.colors.textMuted,
        fontSize: t.typography.sizes.sm,
        textAlign: 'center',
      },
      errorText: {
        color: t.colors.danger,
        fontSize: t.typography.sizes.sm,
        textAlign: 'center',
      },
      sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: t.spacing.md,
        marginBottom: t.spacing.xs,
      },
      sectionTitle: {
        fontSize: t.typography.sizes.sm,
        fontWeight: '600',
        color: t.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      },
      sectionCount: {
        fontSize: t.typography.sizes.xs,
        color: t.colors.textMuted,
      },
      row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: t.spacing.sm,
        gap: t.spacing.md,
      },
      avatar: {
        width: 36,
        height: 36,
        borderRadius: t.radius.full,
        backgroundColor: t.colors.primary.shallow,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      },
      avatarImage: {
        width: '100%',
        height: '100%',
      },
      rowInfo: {
        flex: 1,
      },
      rowTitle: {
        fontSize: t.typography.sizes.md,
        fontWeight: '500',
        color: t.colors.text,
      },
      rowSubtitle: {
        fontSize: t.typography.sizes.sm,
        color: t.colors.textMuted,
        marginTop: 2,
      },
    })
  );

  const query = q.trim();
  const isPending =
    query !== debouncedQ || (canSearch && response?.query !== debouncedQ);

  const renderBody = () => {
    if (query.length < MIN_QUERY_LENGTH) {
      return (
        <View style={styles.status}>
          <Text style={styles.statusText}>
            Search doctors, pharmacies, labs, drugs and lab tests.
            {query.length > 0
              ? `\nType at least ${MIN_QUERY_LENGTH} characters.`
              : ''}
          </Text>
        </View>
      );
    }
    if (isPending && !results) {
      return (
        <View style={styles.status}>
          <ActivityIndicator color={appTheme.colors.primary.mid} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.status}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }
    if (!isPending && sections.length === 0) {
      return (
        <View style={styles.status}>
          <Text style={styles.statusText}>
            No results for &ldquo;{debouncedQ}&rdquo;
          </Text>
        </View>
      );
    }

    return sections.map((section) => (
      <View key={section.title}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionCount}>{section.items.length}</Text>
        </View>
        {section.items.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.row}
            activeOpacity={0.7}
            disabled={!item.onPress}
            onPress={item.onPress}
          >
            <View style={styles.avatar}>
              {item.pictureUrl ? (
                <Image
                  source={{ uri: item.pictureUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <IconSymbol
                  name={section.icon}
                  size={18}
                  color={appTheme.colors.primary.mid}
                />
              )}
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {item.subtitle ? (
                <Text style={styles.rowSubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              ) : null}
            </View>
            {item.onPress ? (
              <IconSymbol
                name="chevron.right"
                size={18}
                color={appTheme.colors.textMuted}
              />
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.search}>
        <IconSymbol
          name="magnifyingglass"
          size={18}
          color={appTheme.colors.textMuted}
        />
        <TextInput
          placeholder="Search doctors, pharmacies, drugs..."
          placeholderTextColor={appTheme.colors.textMuted}
          keyboardType="default"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          returnKeyType="search"
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => setDebouncedQ(q.trim())}
          style={styles.searchInput}
        />
        {isPending && results ? (
          <ActivityIndicator size="small" color={appTheme.colors.textMuted} />
        ) : q.length > 0 ? (
          <Pressable onPress={() => setQ('')} hitSlop={8}>
            <IconSymbol
              name="xmark"
              size={18}
              color={appTheme.colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderBody()}
      </ScrollView>
    </View>
  );
};

export default Search;
