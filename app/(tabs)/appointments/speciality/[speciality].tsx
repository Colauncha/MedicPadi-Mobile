import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AvatarFromString from '@/components/avatar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { apiListProfiles, ProfileFields } from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';

const PAGE_SIZE = 10;

export default function DoctorsBySpecialityScreen() {
  const { speciality, label } = useLocalSearchParams<{
    speciality: string;
    label?: string;
  }>();
  const title = label ?? speciality;
  const { token } = useAuth();
  const { theme: appTheme } = useTheme();

  const [doctors, setDoctors] = useState<ProfileFields[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      if (!token) return;
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const res = await apiListProfiles(
          { speciality, role: 'consultant', page: pageNum, limit: PAGE_SIZE },
          token
        );
        const items = Array.isArray(res.data) ? res.data : [];
        setTotalPages(res.meta?.total_pages ?? 1);
        setDoctors((prev) => (pageNum === 1 ? items : [...prev, ...items]));
        setPage(pageNum);
      } catch {
        // errors shown via empty state
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token, speciality]
  );

  useEffect(() => {
    if (!token) return;

    const timeoutId = setTimeout(() => {
      void fetchPage(1);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [token, fetchPage]);

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) fetchPage(page + 1);
  };

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      list: { padding: theme.spacing.base, paddingBottom: 100 },
      card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: theme.spacing.md,
      },
      avatarImg: { width: 56, height: 56, borderRadius: 28 },
      info: { flex: 1 },
      name: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '500',
        color: theme.colors.text,
        marginBottom: 2,
      },
      speciality: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.primary.mid,
        marginBottom: 4,
        textTransform: 'capitalize',
      },
      bio: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
        marginBottom: 4,
        lineHeight: 18,
      },
      ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
      rating: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
      },
      loadMoreSpinner: { marginVertical: theme.spacing.lg },
      emptyContainer: {
        alignItems: 'center',
        marginTop: 64,
        gap: theme.spacing.md,
      },
      emptyText: {
        fontSize: theme.typography.sizes.base,
        color: theme.colors.textMuted,
        textAlign: 'center',
      },
    })
  );

  const renderDoctor = ({ item }: { item: ProfileFields }) => {
    const name =
      [item.firstName, item.lastName].filter(Boolean).join(' ') || 'Doctor';
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          item.user_id &&
          router.push({
            pathname: '/appointments/doctor/[id]',
            params: { id: item.user_id },
          })
        }
      >
        {item.profilePicture?.url ? (
          <Image
            source={{ uri: item.profilePicture.url }}
            style={styles.avatarImg}
            contentFit="cover"
          />
        ) : (
          <AvatarFromString input={name} size={56} />
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            Dr. {name}
          </Text>
          <Text style={styles.speciality} numberOfLines={1}>
            {item.speciality ?? title}
          </Text>
          {item.bio ? (
            <Text style={styles.bio} numberOfLines={2}>
              {item.bio}
            </Text>
          ) : null}
          <View style={styles.ratingRow}>
            <IconSymbol
              name="star.fill"
              size={14}
              color={appTheme.colors.warning}
            />
            <Text style={styles.rating}>
              {item.rating != null ? Number(item.rating).toFixed(1) : '—'}
            </Text>
          </View>
        </View>
        <IconSymbol
          name="chevron.right"
          size={20}
          color={appTheme.colors.textMuted}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title }} />
      {loading ? (
        <ActivityIndicator
          style={{ flex: 1 }}
          color={appTheme.colors.primary.deep}
        />
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item, i) => item.id ?? item.user_id ?? String(i)}
          renderItem={renderDoctor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                style={styles.loadMoreSpinner}
                color={appTheme.colors.primary.mid}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconSymbol
                name="magnifyingglass"
                size={48}
                color={appTheme.colors.textMuted}
              />
              <Text style={styles.emptyText}>
                No doctors found for {title}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
