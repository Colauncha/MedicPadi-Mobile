import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { PatientStackParamList } from '../../navigation/types';
import { Header } from '../../components/Header';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { colors, typography, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { apiUpdateProfile, apiUploadProfilePicture } from '../../services/api';

type Nav = NativeStackNavigationProp<PatientStackParamList>;

interface FormState {
  firstName: string;
  lastName: string;
  gender: string;
  bloodGroup: string;
  genotype: string;
  phoneNumber: string;
  emergencyContact: string;
}

interface EmergencyFormState {
  name: string;
  phone: string;
  email: string;
  relationship: string;
}

const GENDER_OPTIONS = ['male', 'female', 'Other'];
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENOTYPE_OPTIONS = ['AA', 'AS', 'SS', 'AC'];

const ChipSelect = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <View style={styles.chipGroup}>
    <Text style={styles.chipLabel}>{label}</Text>
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.chip, value === opt && styles.chipActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { profile, token, refreshProfile } = useAuth();

  const p = profile?.profile;

  const [form, setForm] = useState<FormState>({
    firstName: p?.firstName ?? '',
    lastName: p?.lastName ?? '',
    gender: p?.gender ?? '',
    bloodGroup: p?.bloodGroup ?? '',
    genotype: p?.genotype ?? '',
    phoneNumber: p?.phoneNumber ?? '',
    emergencyContact: p?.emergencyContact ?? '',
  });

  const [nok, setNok] = useState<EmergencyFormState>({
    name: p?.nextOfKin?.name ?? '',
    phone: p?.nextOfKin?.phone ?? '',
    email: p?.nextOfKin?.email ?? '',
    relationship: p?.nextOfKin?.relationship ?? '',
  });

  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const fp = profile?.profile;
      setForm({
        firstName: fp?.firstName ?? '',
        lastName: fp?.lastName ?? '',
        gender: fp?.gender ?? '',
        bloodGroup: fp?.bloodGroup ?? '',
        genotype: fp?.genotype ?? '',
        phoneNumber: fp?.phoneNumber ?? '',
        emergencyContact: fp?.emergencyContact ?? '',
      });
      setNok({
        name: fp?.nextOfKin?.name ?? '',
        phone: fp?.nextOfKin?.phone ?? '',
        email: fp?.nextOfKin?.email ?? '',
        relationship: fp?.nextOfKin?.relationship ?? '',
      });
      setPickedImageUri(null);
    }, [profile]),
  );

  const removeUnsetFields = (obj: Record<string, any>) => {
    const newObj: Record<string, any> = {};
    for (const key in obj) {
      if (obj[key] !== '') {
        newObj[key] = obj[key];
      }
    }
    return newObj;
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Allow access to your photo library to change your profile picture.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPickedImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await apiUpdateProfile(
        {
          ...removeUnsetFields(form),
          nextOfKin: removeUnsetFields(nok),
        },
        token,
      );
      if (pickedImageUri) {
        await apiUploadProfilePicture(pickedImageUri, token);
      }
      await refreshProfile();
      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const avatarUri = pickedImageUri ?? profile?.profile?.profilePicture?.url ?? null;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Edit Profile" showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]} />
              )}
              <View style={styles.cameraOverlay}>
                <MaterialIcons name="camera-alt" size={16} color={colors.text.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Tap to change photo</Text>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Input
              label="First Name"
              placeholder="Enter first name"
              value={form.firstName}
              onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))}
            />
            <Input
              label="Last Name"
              placeholder="Enter last name"
              value={form.lastName}
              onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))}
            />
            <Input
              label="Phone Number"
              placeholder="Enter phone number"
              value={form.phoneNumber}
              onChangeText={(v) => setForm((f) => ({ ...f, phoneNumber: v }))}
            />
            <Input
              label="Emergency Contact"
              placeholder="Enter emergency phone number"
              value={form.emergencyContact}
              onChangeText={(v) => setForm((f) => ({ ...f, emergencyContact: v }))}
            />
            <ChipSelect
              label="Gender"
              options={GENDER_OPTIONS}
              value={form.gender}
              onChange={(v) => setForm((f) => ({ ...f, gender: v }))}
            />
            <ChipSelect
              label="Blood Group"
              options={BLOOD_GROUP_OPTIONS}
              value={form.bloodGroup}
              onChange={(v) => setForm((f) => ({ ...f, bloodGroup: v }))}
            />
            <ChipSelect
              label="Genotype"
              options={GENOTYPE_OPTIONS}
              value={form.genotype}
              onChange={(v) => setForm((f) => ({ ...f, genotype: v }))}
            />
          </View>

          {/* Next of Kin */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next of Kin</Text>
            <Input
              label="Name"
              placeholder="Contact name"
              value={nok.name}
              onChangeText={(v) => setNok((e) => ({ ...e, name: v }))}
            />
            <Input
              label="Phone"
              placeholder="Contact phone number"
              value={nok.phone}
              onChangeText={(v) => setNok((e) => ({ ...e, phone: v }))}
              keyboardType="phone-pad"
            />
            <Input
              label="Email"
              placeholder="Contact email address"
              value={nok.email}
              onChangeText={(v) => setNok((e) => ({ ...e, email: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Relationship"
              placeholder="e.g. Spouse, Parent, Sibling"
              value={nok.relationship}
              onChangeText={(v) => setNok((e) => ({ ...e, relationship: v }))}
            />
          </View>

          <Button
            label="Save Changes"
            variant="primary"
            size="lg"
            loading={saving}
            onPress={handleSave}
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.base, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatarContainer: { position: 'relative', marginBottom: spacing.sm },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: colors.background,
  },
  avatarPlaceholder: { backgroundColor: colors.text.dark },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[950],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  changePhotoText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  chipGroup: { marginBottom: spacing.base },
  chipLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: {
    backgroundColor: colors.primary[950],
    borderColor: colors.primary[950],
  },
  chipText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
  },
  chipTextActive: { color: colors.text.white },
  saveBtn: { marginTop: spacing.md },
});
