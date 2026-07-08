import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../navigation/types';
import { Header } from '../../components/Header';
import { colors, typography, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { apiListProfiles, ProfileFields } from '../../services/api';
import { AvatarFromString } from '../../utils';

type Nav = NativeStackNavigationProp<PatientStackParamList>;
type Route = RouteProp<PatientStackParamList, 'DoctorsBySpeciality'>;

const PAGE_SIZE = 10;

export const DoctorsBySpecialityScreen: React.FC = () => {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { token } = useAuth();

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
          { speciality: params.speciality, role: 'consultant', page: pageNum, limit: PAGE_SIZE },
          token,
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
    [token, params.speciality],
  );

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) fetchPage(page + 1);
  };

  const renderDoctor = ({ item }: { item: ProfileFields }) => {
    const name = [item.firstName, item.lastName].filter(Boolean).join(' ') || 'Doctor';
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('DoctorDetails', { doctorId: item.user_id })}
      >
        <View style={styles.avatar}>
          {item.profilePicture?.url ? (
            <Image source={{ uri: item.profilePicture.url }} style={styles.avatarImg} />
          ) : (
            <AvatarFromString input={name} size={56} />
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>Dr. {name}</Text>
          <Text style={styles.speciality} numberOfLines={1}>
            {item.speciality ?? params.label}
          </Text>
          {item.bio ? (
            <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
          ) : null}
          <View style={styles.ratingRow}>
            <MaterialIcons name="star" size={14} color={colors.gold} />
            <Text style={styles.rating}>{item.rating?.toFixed(1) ?? '—'}</Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={colors.text.muted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={params.label} showBack />

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary[950]} />
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
              <ActivityIndicator style={styles.loadMoreSpinner} color={colors.primary[800]} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="person-search" size={48} color={colors.text.muted} />
              <Text style={styles.emptyText}>No doctors found for {params.label}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.base, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.cardLight,
  },
  avatarImg: { width: 56, height: 56, borderRadius: 28 },
  info: { flex: 1 },
  name: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    marginBottom: 2,
  },
  speciality: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.primary[800],
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  bio: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginBottom: 4,
    lineHeight: 18,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  loadMoreSpinner: { marginVertical: spacing.lg },
  emptyContainer: { alignItems: 'center', marginTop: 64, gap: spacing.md },
  emptyText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.muted,
    textAlign: 'center',
  },
});
