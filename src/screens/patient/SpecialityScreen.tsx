import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../navigation/types';
import { Header } from '../../components/Header';
import { colors, typography, spacing, radius } from '../../theme';

type Nav = NativeStackNavigationProp<PatientStackParamList>;
type MCIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Speciality {
  key: string;
  label: string;
  icon: MCIconName;
  iconColor: string;
  bgColor: string;
}

const SPECIALITIES: Speciality[] = [
  { key: 'general consultant', label: 'General Physician', icon: 'stethoscope',             iconColor: '#7B68EE', bgColor: '#EEEAFF' },
  { key: 'cardiologists',      label: 'Cardiologist',      icon: 'heart-pulse',              iconColor: '#E5334B', bgColor: '#FDEDEF' },
  { key: 'dermatologists',     label: 'Dermatologist',     icon: 'face-man',                 iconColor: '#F06292', bgColor: '#FCE4EC' },
  { key: 'neurologists',       label: 'Neurologist',        icon: 'brain',                    iconColor: '#3F51B5', bgColor: '#E8EAF6' },
  { key: 'psychiatrists',      label: 'Psychiatrist',       icon: 'head-cog',                 iconColor: '#9C27B0', bgColor: '#F3E5F5' },
  { key: 'endocrinologists',   label: 'Endocrinologist',   icon: 'needle',                   iconColor: '#00ACC1', bgColor: '#E0F7FA' },
  { key: 'oncology',           label: 'Oncologist',         icon: 'radioactive',              iconColor: '#F98007', bgColor: '#FFF3E0' },
  { key: 'radiologists',       label: 'Radiologist',        icon: 'radiology-box-outline',    iconColor: '#E65100', bgColor: '#FBE9E7' },
  { key: 'pathologists',       label: 'Pathologist',        icon: 'microscope',               iconColor: '#009688', bgColor: '#E0F2F1' },
  { key: 'others',             label: 'Others',             icon: 'dots-horizontal-circle',   iconColor: '#607D8B', bgColor: '#ECEFF1' },
];

const { width } = Dimensions.get('window');
const CARD_GAP = spacing.md;
const CARD_WIDTH = (width - spacing.base * 2 - CARD_GAP) / 2;

export const SpecialityScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      query.trim()
        ? SPECIALITIES.filter((s) =>
            s.label.toLowerCase().includes(query.toLowerCase()),
          )
        : SPECIALITIES,
    [query],
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Specialty" showBack />

      <View style={styles.intro}>
        <Text style={styles.heading}>Select Specialty</Text>
        <Text style={styles.sub}>Select the type of doctor you want to consult</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.searchRow}>
        <MaterialIcons name="search" size={18} color={colors.text.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="search doctor"
          placeholderTextColor={colors.text.muted}
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
              navigation.navigate('DoctorsBySpeciality', {
                speciality: item.key,
                label: item.label,
              })
            }
          >
            <View style={[styles.iconCircle, { backgroundColor: item.bgColor }]}>
              <MaterialCommunityIcons name={item.icon} size={32} color={item.iconColor} />
            </View>
            <Text style={styles.cardLabel} numberOfLines={2}>{item.label}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No specialties match "{query}"</Text>
        }
        keyboardShouldPersistTaps="handled"
      />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  intro: { paddingHorizontal: spacing.base, marginTop: spacing.sm, marginBottom: spacing.md },
  heading: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.lg,
    color: colors.text.dark,
    marginBottom: 2,
  },
  sub: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    marginHorizontal: spacing.base,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    height: 44,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
  },
  grid: { paddingHorizontal: spacing.base, paddingBottom: 32 },
  row: { gap: CARD_GAP, marginBottom: CARD_GAP },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  cardLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
    textAlign: 'center',
    lineHeight: 18,
  },
  empty: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
