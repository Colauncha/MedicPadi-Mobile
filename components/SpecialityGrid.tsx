import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { ComponentProps, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

type MCIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Speciality {
  key: string;
  label: string;
  icon: MCIconName;
  iconColor: string;
  bgColor: string;
}

const SPECIALITIES: Speciality[] = [
  { key: 'general consultant', label: 'General Physician', icon: 'stethoscope', iconColor: '#7B68EE', bgColor: '#EEEAFF' },
  { key: 'cardiologists', label: 'Cardiologist', icon: 'heart-pulse', iconColor: '#E5334B', bgColor: '#FDEDEF' },
  { key: 'dermatologists', label: 'Dermatologist', icon: 'face-man', iconColor: '#F06292', bgColor: '#FCE4EC' },
  { key: 'neurologists', label: 'Neurologist', icon: 'brain', iconColor: '#3F51B5', bgColor: '#E8EAF6' },
  { key: 'psychiatrists', label: 'Psychiatrist', icon: 'head-cog', iconColor: '#9C27B0', bgColor: '#F3E5F5' },
  { key: 'endocrinologists', label: 'Endocrinologist', icon: 'needle', iconColor: '#00ACC1', bgColor: '#E0F7FA' },
  { key: 'oncology', label: 'Oncologist', icon: 'radioactive', iconColor: '#F98007', bgColor: '#FFF3E0' },
  { key: 'radiologists', label: 'Radiologist', icon: 'radiology-box-outline', iconColor: '#E65100', bgColor: '#FBE9E7' },
  { key: 'pathologists', label: 'Pathologist', icon: 'microscope', iconColor: '#009688', bgColor: '#E0F2F1' },
  { key: 'others', label: 'Others', icon: 'dots-horizontal-circle', iconColor: '#607D8B', bgColor: '#ECEFF1' },
];

const { width } = Dimensions.get('window');
const CARD_GAP = spacing.md;
const CARD_WIDTH = (width - spacing.base * 2 - CARD_GAP) / 2;

/**
 * Searchable grid of doctor specialities. Tapping one opens the doctors list
 * for it, which continues to the doctor profile and booking screens.
 */
export default function SpecialityGrid() {
  const { theme: appTheme } = useTheme();
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      query.trim()
        ? SPECIALITIES.filter((s) =>
            s.label.toLowerCase().includes(query.toLowerCase())
          )
        : SPECIALITIES,
    [query]
  );

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1 },
      intro: {
        paddingHorizontal: theme.spacing.base,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.md,
      },
      heading: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 2,
      },
      sub: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
      },
      searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.xl,
        marginHorizontal: theme.spacing.base,
        marginBottom: theme.spacing.lg,
        paddingHorizontal: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: theme.spacing.sm,
      },
      searchInput: {
        flex: 1,
        height: 44,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.text,
      },
      grid: { paddingHorizontal: theme.spacing.base, paddingBottom: 100 },
      row: { gap: CARD_GAP, marginBottom: CARD_GAP },
      card: {
        width: CARD_WIDTH,
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.xl,
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
        paddingHorizontal: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
      },
      cardLabel: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
        textAlign: 'center',
        lineHeight: 18,
      },
      empty: {
        fontSize: theme.typography.sizes.base,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginTop: theme.spacing.xxl,
      },
    })
  );

  return (
    <View style={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.heading}>Select Specialty</Text>
        <Text style={styles.sub}>
          Select the type of doctor you want to consult
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.searchRow}>
          <IconSymbol
            name="magnifyingglass"
            size={18}
            color={appTheme.colors.textMuted}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="search doctor"
            placeholderTextColor={appTheme.colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.key}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.75}
              onPress={() =>
                router.push({
                  pathname: '/appointments/speciality/[speciality]',
                  params: { speciality: item.key, label: item.label },
                })
              }
            >
              <View
                style={[styles.iconCircle, { backgroundColor: item.bgColor }]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={32}
                  color={item.iconColor}
                />
              </View>
              <Text style={styles.cardLabel} numberOfLines={2}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No specialties match &quot;{query}&quot;
            </Text>
          }
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>
    </View>
  );
}
