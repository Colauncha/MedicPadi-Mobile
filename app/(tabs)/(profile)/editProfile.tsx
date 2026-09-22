import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownOption } from '@/components/ui/DropDown2';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  apiUpdateProfile,
  apiUploadProfilePicture,
  DoctorsSpecialityResponse,
  fetchDoctorsSpeciality,
} from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';

const genderOptions: DropdownOption[] = [
  {
    value: 'male',
    label: 'Male',
  },
  {
    value: 'female',
    label: 'Female',
  },
];

export type ConsultantFormValues = {
  firstName: string;
  lastName: string;
  gender: string;
  speciality: string;
  bio: string;
  placeOfWork: string;
  yearsOfService: string;
  awards: string;
  costPerSession: string;
  sessionLength: string;
  licenceNumber: string;
};

type ProfilePayload = Record<string, string | number | undefined>;

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function removeUnsetFields(obj: ProfilePayload): ProfilePayload {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

export default function EditConsultantProfileScreen() {
  const { profile, token } = useAuth();
  const { theme: appTheme } = useTheme();

  const [doctorsSpeciality, setDoctorsSpeciality] =
    useState<DoctorsSpecialityResponse | null>(null);

  const [formValues, setFormValues] = useState<ConsultantFormValues>({
    firstName: '',
    lastName: '',
    gender: '',
    speciality: '',
    bio: '',
    placeOfWork: '',
    yearsOfService: '',
    awards: '',
    costPerSession: '',
    sessionLength: '',
    licenceNumber: '',
  });

  const [openDropdown, setOpenDropdown] = useState<
    keyof Pick<ConsultantFormValues, 'gender' | 'speciality'> | null
  >(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);

  const consultantProfile = profile?.profile;
  const [prevConsultantId, setPrevConsultantId] = useState('');

  if (consultantProfile?.id !== prevConsultantId) {
    setPrevConsultantId(consultantProfile?.id || '');
    setFormValues({
      firstName: consultantProfile?.firstName ?? '',
      lastName: consultantProfile?.lastName ?? '',
      gender: consultantProfile?.gender?.toLowerCase() ?? '',
      speciality: consultantProfile?.speciality ?? '',
      bio: consultantProfile?.bio ?? '',
      placeOfWork: consultantProfile?.placeOfWork ?? '',
      yearsOfService:
        consultantProfile?.yearsOfService != null
          ? String(consultantProfile?.yearsOfService)
          : '',
      awards:
        consultantProfile?.awards != null
          ? String(consultantProfile?.awards)
          : '',
      costPerSession:
        consultantProfile?.costPerSession != null
          ? String(consultantProfile?.costPerSession)
          : '',
      sessionLength:
        consultantProfile?.sessionLength != null
          ? String(consultantProfile?.sessionLength)
          : '',
      licenceNumber: consultantProfile?.licenceNumber ?? '',
    });
  }

  /*
   * Fetch consultant specialities.
   */
  useEffect(() => {
    if (!token) {
      return;
    }

    let mounted = true;

    const loadSpecialities = async () => {
      try {
        const response = await fetchDoctorsSpeciality(token);

        if (mounted) {
          setDoctorsSpeciality(response);
        }
      } catch (error) {
        console.error('Failed to fetch doctor specialities:', error);

        if (mounted) {
          setDoctorsSpeciality(null);
        }
      }
    };

    loadSpecialities();

    return () => {
      mounted = false;
    };
  }, [token]);

  /*
   * Convert the API speciality response into Dropdown options.
   *
   * The backend returns something like:
   *
   * {
   *   general: "General Consultant",
   *   oncology: "Oncology",
   *   ...
   * }
   */
  const specialityOptions = useMemo<DropdownOption[]>(() => {
    if (!doctorsSpeciality) {
      return [];
    }

    return Object.entries(doctorsSpeciality).map(([value, label]) => ({
      value,
      label,
    }));
  }, [doctorsSpeciality]);

  const updateValue = <K extends keyof ConsultantFormValues>(
    fieldName: K,
    value: ConsultantFormValues[K]
  ) => {
    setFormValues((previous) => ({
      ...previous,
      [fieldName]: value,
    }));
  };

  const handleGoBack = () => {
    if (isSubmitting) {
      return;
    }
    router.replace('/profile');
  };

  /*
   * Convert form values into the API payload.
   */
  const formatFields = (values: ConsultantFormValues): ProfilePayload => ({
    firstName: values.firstName.trim() || undefined,

    lastName: values.lastName.trim() || undefined,

    gender: values.gender || undefined,

    speciality:
      values.speciality === 'general'
        ? 'general consultant'
        : values.speciality || undefined,

    bio: values.bio.trim() || undefined,

    placeOfWork: values.placeOfWork.trim() || undefined,

    yearsOfService: parseOptionalNumber(values.yearsOfService),

    awards: parseOptionalNumber(values.awards),

    costPerSession: parseOptionalNumber(values.costPerSession),

    sessionLength: parseOptionalNumber(values.sessionLength),

    licenceNumber: values.licenceNumber.trim() || undefined,
  });

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (!token) {
      Alert.alert(
        'Authentication error',
        'Your session has expired. Please log in again.'
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = removeUnsetFields(formatFields(formValues));

      /*
       * Update profile information first.
       */
      await apiUpdateProfile(payload, token);

      /*
       * Upload the new image only when the user selected one.
       */
      if (pickedImageUri) {
        await apiUploadProfilePicture(pickedImageUri, token);
      }

      Alert.alert(
        'Profile updated',
        'Your profile has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: handleGoBack,
          },
        ]
      );
    } catch (error) {
      console.error('Failed to update consultant profile:', error);

      Alert.alert(
        'Unable to update profile',
        'Something went wrong while saving your profile. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadPic = async () => {
    if (isSubmitting) {
      return;
    }

    if (!token) {
      Alert.alert(
        'Authentication error',
        'Your session has expired. Please log in again.'
      );
      return;
    }

    if (!pickedImageUri) return;

    try {
      setIsSubmitting(true);
      const resp = await apiUploadProfilePicture(pickedImageUri, token);
      if (resp) {
        Alert.alert('Profile photo uploaded successfully');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Unable to update profile', `${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickImage = async () => {
    if (isSubmitting) {
      return;
    }

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

  const avatarUri =
    pickedImageUri ?? profile?.profile?.profilePicture?.url ?? null;

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingBottom: theme.spacing.xxl + 20,
      },

      keyboard: {
        flex: 1,
      },

      scroll: {
        flexGrow: 1,
        alignItems: 'center',
        padding: theme.spacing.base,
      },

      card: {
        // backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.xl,
        borderColor: theme.colors.border,
        borderWidth: 0,
        // padding: theme.spacing.lg,
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
        backgroundColor: theme.colors.textSecondary,
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

      fieldContainer: {
        marginBottom: theme.spacing.base,
      },

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

      textArea: {
        minHeight: 110,
        paddingTop: theme.spacing.md,
        textAlignVertical: 'top',
      },

      btn: {
        width: '100%',
        marginTop: theme.spacing.base,
      },

      emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: theme.spacing.xl,
      },

      loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
      },
    })
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
            <View>
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

                <ThemedText style={styles.upperRowText}>
                  Edit Profile
                </ThemedText>
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
                    <View style={[styles.avatar, styles.avatarPlaceholder]} />
                  )}

                  <View style={styles.cameraOverlay}>
                    <IconSymbol
                      name="camera"
                      size={16}
                      color={appTheme.colors.mono.light}
                    />
                  </View>
                </TouchableOpacity>

                {pickedImageUri ? (
                  <Button
                    label="Save"
                    onPress={handleUploadPic}
                    style={{ height: 30 }}
                    loading={isSubmitting}
                  />
                ) : (
                  <ThemedText style={styles.changePhotoText}>
                    Tap to change photo
                  </ThemedText>
                )}
              </View>
            </View>

            {/* First name */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>First Name</ThemedText>

              <TextInput
                value={formValues.firstName}
                placeholder="First Name"
                placeholderTextColor={appTheme.colors.textMuted}
                keyboardType="default"
                autoCapitalize="words"
                editable={!isSubmitting}
                style={styles.input}
                onFocus={() => setOpenDropdown(null)}
                onChangeText={(text) => updateValue('firstName', text)}
              />
            </View>

            {/* Last name */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>Last Name</ThemedText>

              <TextInput
                value={formValues.lastName}
                placeholder="Last Name"
                placeholderTextColor={appTheme.colors.textMuted}
                keyboardType="default"
                autoCapitalize="words"
                editable={!isSubmitting}
                style={styles.input}
                onFocus={() => setOpenDropdown(null)}
                onChangeText={(text) => updateValue('lastName', text)}
              />
            </View>

            {/* Gender */}
            <View style={styles.fieldContainer}>
              <Dropdown
                label="Gender"
                value={formValues.gender}
                placeholder="Select gender"
                options={genderOptions}
                isOpen={openDropdown === 'gender'}
                onOpenChange={(open) => setOpenDropdown(open ? 'gender' : null)}
                onChange={(value) => {
                  updateValue('gender', value);
                  setOpenDropdown(null);
                }}
              />
            </View>

            {/* Speciality */}
            <View style={styles.fieldContainer}>
              <Dropdown
                label="Speciality"
                value={
                  formValues.speciality === 'general consultant'
                    ? 'general'
                    : formValues.speciality
                }
                placeholder="Select speciality"
                options={specialityOptions}
                isOpen={openDropdown === 'speciality'}
                onOpenChange={(open) =>
                  setOpenDropdown(open ? 'speciality' : null)
                }
                onChange={(value) => {
                  updateValue('speciality', value);
                  setOpenDropdown(null);
                }}
              />
            </View>

            {/* Bio */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>Bio</ThemedText>

              <TextInput
                value={formValues.bio}
                placeholder="About you"
                placeholderTextColor={appTheme.colors.textMuted}
                keyboardType="default"
                multiline
                numberOfLines={5}
                editable={!isSubmitting}
                style={[styles.input, styles.textArea]}
                onFocus={() => setOpenDropdown(null)}
                onChangeText={(text) => updateValue('bio', text)}
              />
            </View>

            {/* Place of work */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>Place of Work</ThemedText>

              <TextInput
                value={formValues.placeOfWork}
                placeholder="Company name"
                placeholderTextColor={appTheme.colors.textMuted}
                keyboardType="default"
                autoCapitalize="words"
                editable={!isSubmitting}
                style={styles.input}
                onFocus={() => setOpenDropdown(null)}
                onChangeText={(text) => updateValue('placeOfWork', text)}
              />
            </View>

            {/* Years of service */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>Years of Service</ThemedText>

              <TextInput
                value={formValues.yearsOfService}
                placeholder="Experience in Years"
                placeholderTextColor={appTheme.colors.textMuted}
                keyboardType="numeric"
                editable={!isSubmitting}
                style={styles.input}
                onFocus={() => setOpenDropdown(null)}
                onChangeText={(text) => updateValue('yearsOfService', text)}
              />
            </View>

            {/* Awards */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>Awards</ThemedText>

              <TextInput
                value={formValues.awards}
                placeholder="Amount of awards"
                placeholderTextColor={appTheme.colors.textMuted}
                keyboardType="numeric"
                editable={!isSubmitting}
                style={styles.input}
                onFocus={() => setOpenDropdown(null)}
                onChangeText={(text) => updateValue('awards', text)}
              />
            </View>

            {/* Cost per session */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>Cost Per Session (₦)</ThemedText>

              <TextInput
                value={formValues.costPerSession}
                placeholder="Cost per session"
                placeholderTextColor={appTheme.colors.textMuted}
                keyboardType="numeric"
                editable={!isSubmitting}
                style={styles.input}
                onFocus={() => setOpenDropdown(null)}
                onChangeText={(text) => updateValue('costPerSession', text)}
              />
            </View>

            {/* Session length */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>
                Session Length (minutes)
              </ThemedText>

              <TextInput
                value={formValues.sessionLength}
                placeholder="Length per session (minutes)"
                placeholderTextColor={appTheme.colors.textMuted}
                keyboardType="numeric"
                editable={!isSubmitting}
                style={styles.input}
                onFocus={() => setOpenDropdown(null)}
                onChangeText={(text) => updateValue('sessionLength', text)}
              />
            </View>

            {/* Licence number */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>Licence Number</ThemedText>

              <TextInput
                value={formValues.licenceNumber}
                placeholder="Licence number"
                placeholderTextColor={appTheme.colors.textMuted}
                keyboardType="default"
                editable={!isSubmitting}
                style={styles.input}
                onFocus={() => setOpenDropdown(null)}
                onChangeText={(text) => updateValue('licenceNumber', text)}
              />
            </View>

            {/* Submit */}
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
