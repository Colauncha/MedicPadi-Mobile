import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  apiUpdateProfile,
  apiUploadProfilePicture,
  NextOfKin,
  ProfileUpdateData,
} from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';

const GENDER_OPTIONS = ['male', 'female', 'other'];
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENOTYPE_OPTIONS = ['AA', 'AS', 'SS', 'AC'];

type PatientFormValues = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  emergencyContact: string;
  dateOfBirth: string;
  height: string;
  weight: string;
  gender: string;
  bloodGroup: string;
  genotype: string;
};

type NextOfKinValues = Required<NextOfKin>;

/** Drops empty strings so untouched fields don't overwrite server values. */
function removeUnsetFields<T extends Record<string, string>>(
  obj: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value.trim() !== '')
  ) as Partial<T>;
}

const formatDob = (iso: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  return isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
};

export default function EditProfileScreen() {
  const { profile, token, refreshProfile } = useAuth();
  const { theme: appTheme } = useTheme();

  const [formValues, setFormValues] = useState<PatientFormValues>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    emergencyContact: '',
    dateOfBirth: '',
    height: '',
    weight: '',
    gender: '',
    bloodGroup: '',
    genotype: '',
  });
  const [nextOfKin, setNextOfKin] = useState<NextOfKinValues>({
    name: '',
    phone: '',
    email: '',
    relationship: '',
  });
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyDraft, setAllergyDraft] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);

  // Re-seed the form whenever a different profile is loaded.
  const patientProfile = profile?.profile;
  const [prevProfileId, setPrevProfileId] = useState('');

  if (patientProfile?.id !== prevProfileId) {
    setPrevProfileId(patientProfile?.id || '');
    setFormValues({
      firstName: patientProfile?.firstName ?? '',
      lastName: patientProfile?.lastName ?? '',
      phoneNumber: patientProfile?.phoneNumber ?? '',
      emergencyContact: patientProfile?.emergencyContact ?? '',
      dateOfBirth: patientProfile?.dateOfBirth ?? '',
      height: patientProfile?.height ?? '',
      weight: patientProfile?.weight ?? '',
      gender: patientProfile?.gender?.toLowerCase() ?? '',
      bloodGroup: patientProfile?.bloodGroup ?? '',
      genotype: patientProfile?.genotype ?? '',
    });
    setNextOfKin({
      name: patientProfile?.nextOfKin?.name ?? '',
      phone: patientProfile?.nextOfKin?.phone ?? '',
      email: patientProfile?.nextOfKin?.email ?? '',
      relationship: patientProfile?.nextOfKin?.relationship ?? '',
    });
    setAllergies(patientProfile?.allergies ?? []);
  }

  const updateValue = <K extends keyof PatientFormValues>(
    fieldName: K,
    value: PatientFormValues[K]
  ) => {
    setFormValues((previous) => ({ ...previous, [fieldName]: value }));
  };

  const updateNextOfKin = (fieldName: keyof NextOfKinValues, value: string) => {
    setNextOfKin((previous) => ({ ...previous, [fieldName]: value }));
  };

  const addAllergy = (raw: string) => {
    const items = raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (items.length === 0) return;
    setAllergies((previous) =>
      Array.from(new Set([...previous, ...items]))
    );
    setAllergyDraft('');
  };

  const handleAllergyChange = (text: string) => {
    // A trailing comma commits the tag.
    if (text.endsWith(',')) {
      addAllergy(text);
    } else {
      setAllergyDraft(text);
    }
  };

  const handleGoBack = () => {
    if (isSubmitting) return;
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/profile');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!token) {
      Alert.alert(
        'Authentication error',
        'Your session has expired. Please log in again.'
      );
      return;
    }

    // Include a half-typed allergy that wasn't committed with a comma.
    const finalAllergies = allergyDraft.trim()
      ? Array.from(new Set([...allergies, allergyDraft.trim()]))
      : allergies;

    const nokValues = removeUnsetFields(nextOfKin);
    const payload: ProfileUpdateData = {
      ...removeUnsetFields(formValues),
      allergies: finalAllergies,
      ...(Object.keys(nokValues).length > 0 ? { nextOfKin: nokValues } : {}),
    };

    try {
      setIsSubmitting(true);
      await apiUpdateProfile(payload, token);
      if (pickedImageUri) {
        await apiUploadProfilePicture(pickedImageUri, token);
      }
      await refreshProfile();

      Alert.alert('Profile updated', 'Your profile has been updated.', [
        { text: 'OK', onPress: handleGoBack },
      ]);
    } catch (error: any) {
      console.error('Failed to update patient profile:', error);
      Alert.alert(
        'Unable to update profile',
        error?.message ??
          'Something went wrong while saving your profile. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickImage = async () => {
    if (isSubmitting) return;

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Allow access to your photo library to change your profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setPickedImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to select profile picture:', error);
      Alert.alert(
        'Unable to select image',
        'There was a problem selecting the image. Please try again.'
      );
    }
  };

  const avatarUri = pickedImageUri ?? patientProfile?.profilePicture?.url ?? null;

  const dobDate = formValues.dateOfBirth
    ? new Date(formValues.dateOfBirth)
    : new Date(2000, 0, 1);

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingBottom: theme.spacing.xxl + 20,
      },

      keyboard: { flex: 1 },

      scroll: {
        flexGrow: 1,
        alignItems: 'center',
        padding: theme.spacing.base,
        paddingBottom: 80,
      },

      card: {
        width: '100%',
        maxWidth: 500,
      },

      upperRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.base,
        position: 'relative',
      },

      upperRowItem: {
        position: 'absolute',
        top: 0,
        left: 2,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      },

      upperRowText: {
        fontFamily: theme.typography.fonts?.rounded,
        color: theme.colors.text,
      },

      upperRowItemText: {
        fontSize: theme.typography.sizes.base,
        fontFamily: theme.typography.fonts?.mono,
        color: theme.colors.textMuted,
      },

      avatarSection: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
      },

      avatarContainer: {
        position: 'relative',
        marginBottom: theme.spacing.sm,
      },

      avatar: {
        width: 120,
        height: 120,
        borderRadius: theme.radius.full,
        borderWidth: 3,
        borderColor: theme.colors.border,
      },

      avatarPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceCardLight,
      },

      cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary.extraDeep,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.colors.border,
      },

      changePhotoText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
      },

      sectionTitle: {
        fontFamily: theme.typography.fonts?.rounded,
        fontSize: theme.typography.sizes.lg,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
      },

      divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.lg,
      },

      fieldContainer: {
        marginBottom: theme.spacing.base,
      },

      fieldRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
      },

      fieldRowItem: { flex: 1 },

      label: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
      },

      input: {
        width: '100%',
        minHeight: 48,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        paddingHorizontal: theme.spacing.md,
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.md,
      },

      dateField: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },

      dateText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.text,
      },

      placeholderText: {
        color: theme.colors.textMuted,
      },

      chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
      },

      chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceCard,
      },

      chipActive: {
        backgroundColor: theme.colors.primary.extraDeep,
        borderColor: theme.colors.primary.extraDeep,
      },

      chipText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
        textTransform: 'capitalize',
      },

      chipTextActive: {
        color: theme.colors.buttonText,
      },

      tagRow: {
        marginTop: theme.spacing.sm,
      },

      btn: {
        width: '100%',
        marginTop: theme.spacing.base,
      },
    })
  );

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    props: TextInputProps = {}
  ) => (
    <View style={styles.fieldContainer}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        value={value}
        placeholderTextColor={appTheme.colors.textMuted}
        editable={!isSubmitting}
        style={styles.input}
        onChangeText={onChangeText}
        {...props}
      />
    </View>
  );

  const renderChipSelect = (
    label: string,
    options: string[],
    field: 'gender' | 'bloodGroup' | 'genotype'
  ) => (
    <View style={styles.fieldContainer}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.chipRow}>
        {options.map((option) => {
          const active = formValues[field] === option;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => updateValue(field, active ? '' : option)}
              disabled={isSubmitting}
            >
              <ThemedText
                style={[styles.chipText, active && styles.chipTextActive]}
              >
                {option}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView style={styles.card}>
            {/* Header */}
            <View style={styles.upperRow}>
              <Pressable
                style={styles.upperRowItem}
                onPress={handleGoBack}
                disabled={isSubmitting}
              >
                <IconSymbol
                  name="chevron.left"
                  color={appTheme.colors.textMuted}
                  size={16}
                />
                <ThemedText style={styles.upperRowItemText}>Back</ThemedText>
              </Pressable>

              <ThemedText style={styles.upperRowText}>Edit Profile</ThemedText>
            </View>

            {/* Profile photo */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={handlePickImage}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <IconSymbol
                      name="person.fill"
                      size={60}
                      color={appTheme.colors.textMuted}
                    />
                  </View>
                )}

                <View style={styles.cameraOverlay}>
                  <IconSymbol
                    name="camera"
                    size={16}
                    color={appTheme.colors.mono.light}
                  />
                </View>
              </TouchableOpacity>

              <ThemedText style={styles.changePhotoText}>
                {pickedImageUri
                  ? 'New photo will be saved with your changes'
                  : 'Tap to change photo'}
              </ThemedText>
            </View>

            {/* Personal information */}
            <ThemedText style={styles.sectionTitle}>
              Personal Information
            </ThemedText>

            {renderInput(
              'First Name',
              formValues.firstName,
              (text) => updateValue('firstName', text),
              { placeholder: 'First Name', autoCapitalize: 'words' }
            )}
            {renderInput(
              'Last Name',
              formValues.lastName,
              (text) => updateValue('lastName', text),
              { placeholder: 'Last Name', autoCapitalize: 'words' }
            )}
            {renderInput(
              'Phone Number',
              formValues.phoneNumber,
              (text) => updateValue('phoneNumber', text),
              { placeholder: 'Phone number', keyboardType: 'phone-pad' }
            )}
            {renderInput(
              'Emergency Contact',
              formValues.emergencyContact,
              (text) => updateValue('emergencyContact', text),
              {
                placeholder: 'Emergency phone number',
                keyboardType: 'phone-pad',
              }
            )}

            {/* Date of birth */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>Date of Birth</ThemedText>
              <TouchableOpacity
                style={[styles.input, styles.dateField]}
                onPress={() => setShowDatePicker((open) => !open)}
                disabled={isSubmitting}
              >
                <ThemedText
                  style={[
                    styles.dateText,
                    !formValues.dateOfBirth && styles.placeholderText,
                  ]}
                >
                  {formatDob(formValues.dateOfBirth) || 'Select date of birth'}
                </ThemedText>
                <IconSymbol
                  name="calendar"
                  size={18}
                  color={appTheme.colors.textMuted}
                />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={isNaN(dobDate.getTime()) ? new Date(2000, 0, 1) : dobDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onValueChange={(_event, date) => {
                    // Android closes its dialog on pick; iOS stays inline.
                    if (Platform.OS !== 'ios') setShowDatePicker(false);
                    updateValue('dateOfBirth', date.toISOString().split('T')[0]);
                  }}
                  onDismiss={() => setShowDatePicker(false)}
                />
              )}
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldRowItem}>
                {renderInput(
                  'Height (cm)',
                  formValues.height,
                  (text) => updateValue('height', text),
                  { placeholder: 'Height', keyboardType: 'numeric' }
                )}
              </View>
              <View style={styles.fieldRowItem}>
                {renderInput(
                  'Weight (kg)',
                  formValues.weight,
                  (text) => updateValue('weight', text),
                  { placeholder: 'Weight', keyboardType: 'numeric' }
                )}
              </View>
            </View>

            {renderChipSelect('Gender', GENDER_OPTIONS, 'gender')}
            {renderChipSelect('Blood Group', BLOOD_GROUP_OPTIONS, 'bloodGroup')}
            {renderChipSelect('Genotype', GENOTYPE_OPTIONS, 'genotype')}

            {/* Allergies */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>Allergies</ThemedText>
              <TextInput
                value={allergyDraft}
                placeholder="Type an allergy, then comma to add"
                placeholderTextColor={appTheme.colors.textMuted}
                editable={!isSubmitting}
                style={styles.input}
                onChangeText={handleAllergyChange}
                onSubmitEditing={() => addAllergy(allergyDraft)}
                returnKeyType="done"
                blurOnSubmit={false}
              />
              {allergies.length > 0 && (
                <View style={[styles.chipRow, styles.tagRow]}>
                  {allergies.map((allergy) => (
                    <TouchableOpacity
                      key={allergy}
                      style={[styles.chip, styles.chipActive]}
                      onPress={() =>
                        setAllergies((previous) =>
                          previous.filter((item) => item !== allergy)
                        )
                      }
                      disabled={isSubmitting}
                      accessibilityLabel={`Remove ${allergy}`}
                    >
                      <ThemedText
                        style={[styles.chipText, styles.chipTextActive]}
                      >
                        {allergy}
                      </ThemedText>
                      <IconSymbol
                        name="xmark"
                        size={12}
                        color={appTheme.colors.buttonText}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Next of kin */}
            <ThemedText style={styles.sectionTitle}>Next of Kin</ThemedText>

            {renderInput(
              'Name',
              nextOfKin.name,
              (text) => updateNextOfKin('name', text),
              { placeholder: 'Contact name', autoCapitalize: 'words' }
            )}
            {renderInput(
              'Phone',
              nextOfKin.phone,
              (text) => updateNextOfKin('phone', text),
              { placeholder: 'Contact phone number', keyboardType: 'phone-pad' }
            )}
            {renderInput(
              'Email',
              nextOfKin.email,
              (text) => updateNextOfKin('email', text),
              {
                placeholder: 'Contact email address',
                keyboardType: 'email-address',
                autoCapitalize: 'none',
              }
            )}
            {renderInput(
              'Relationship',
              nextOfKin.relationship,
              (text) => updateNextOfKin('relationship', text),
              { placeholder: 'e.g. Spouse, Parent, Sibling' }
            )}

            <Button
              label="Save Changes"
              onPress={handleSubmit}
              loading={isSubmitting}
              style={styles.btn}
            />
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
