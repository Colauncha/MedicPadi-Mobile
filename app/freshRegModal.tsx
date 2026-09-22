import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { storage } from '@/utils/storage';

const FRESH_REGISTRATION = 'fresh_registration';

const completeProfileForm = {
  consultant: {
    gender: {
      placeholder: 'Select gender',
      type: 'dropdown',
      value: 'male',
    },
    speciality: {
      placeholder: 'Select speciality',
      type: 'dropdown',
      value: '',
    },
    bio: {
      placeholder: 'About you',
      type: 'text',
      value: '',
    },
    placeOfWork: {
      placeholder: 'Company name',
      type: 'text',
      value: '',
    },
    yearsOfService: {
      placeholder: 'Experience in Years',
      type: 'number',
      value: '',
    },
    awards: {
      placeholder: 'Amount of awards',
      type: 'number',
      value: '',
    },
    costPerSession: {
      placeholder: 'Cost per session',
      type: 'number',
      value: '',
    },
    sessionLength: {
      placeholder: 'Length per session (minutes)',
      type: 'number',
      value: '',
    },
    licenceNumber: {
      placeholder: 'Licence number',
      type: 'text',
      value: '',
    },
  },

  lab: {
    name: {
      placeholder: 'Enter your Laboratory name',
      type: 'text',
      value: '',
    },
    address: {
      placeholder: 'Company Address',
      type: 'text',
      value: '',
    },
    yearsOfService: {
      placeholder: 'Experience in Years',
      type: 'number',
      value: '',
    },
    awards: {
      placeholder: 'Amount of awards',
      type: 'number',
      value: '',
    },
    registrationNumber: {
      placeholder: 'Registration number',
      type: 'text',
      value: '',
    },
    about: {
      placeholder: 'About your laboratory',
      type: 'text',
      value: '',
    },
  },

  pharmacy: {
    name: {
      placeholder: 'Enter your Pharmacy name',
      type: 'text',
      value: '',
    },
    address: {
      placeholder: 'Company Address',
      type: 'text',
      value: '',
    },
    yearsOfService: {
      placeholder: 'Experience in Years',
      type: 'number',
      value: '',
    },
    awards: {
      placeholder: 'Amount of awards',
      type: 'number',
      value: '',
    },
    registrationNumber: {
      placeholder: 'Registration number',
      type: 'text',
      value: '',
    },
    about: {
      placeholder: 'About your pharmacy',
      type: 'text',
      value: '',
    },
  },
} as const;

type FormRole = keyof typeof completeProfileForm;

type FormField = {
  placeholder: string;
  type: 'text' | 'number' | 'dropdown';
  value: string;
};

type FormValues = Record<string, string>;

type ProfilePayload = Record<string, string | number | undefined>;

function getRole(role?: string): FormRole | null {
  switch (role) {
    case 'consultant':
    case 'doctor':
      return 'consultant';

    case 'lab':
    case 'laboratory':
      return 'lab';

    case 'pharmacy':
      return 'pharmacy';

    default:
      return null;
  }
}

function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase());
}

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function removeUnsetFields(obj: ProfilePayload): ProfilePayload {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

export default function FreshRegModalScreen() {
  const { user, token, profile } = useAuth();
  const { theme: appTheme } = useTheme();

  const [doctorsSpeciality, setDoctorsSpeciality] =
    useState<DoctorsSpecialityResponse | null>(null);

  const [formValues, setFormValues] = useState<FormValues>({});

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);

  const [freshReg, setFreshReg] = useState(false);

  const role = getRole(user?.role);

  /*
   * Build the form configuration for the current role.
   */
  const formFields = useMemo(() => {
    if (!role) {
      return {} as Record<string, FormField>;
    }

    return completeProfileForm[role] as Record<string, FormField>;
  }, [role]);

  /*
   * Check whether this is a fresh registration.
   */
  useEffect(() => {
    let mounted = true;

    const initFreshReg = async () => {
      try {
        const storedValue = await storage.getItem(FRESH_REGISTRATION);

        if (mounted) {
          setFreshReg(storedValue === '1');
        }
      } catch (error) {
        console.error('Failed to check fresh registration:', error);

        if (mounted) {
          setFreshReg(false);
        }
      }
    };

    initFreshReg();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * Fetch doctor specialities.
   */
  useEffect(() => {
    const isDoctor = user?.role === 'consultant' || user?.role === 'doctor';

    if (!isDoctor || !token) {
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
  }, [user?.role, token]);

  const [prevRole, setPrevRole] = useState(role);

  if (role !== prevRole) {
    setPrevRole(role);

    const initialValues: FormValues = {};

    Object.entries(formFields).forEach(([fieldName, field]) => {
      initialValues[fieldName] = field.value;
    });

    setFormValues(initialValues);
    setOpenDropdown(null);
  }
  /*
   * Doctor speciality dropdown options.
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

  /*
   * Gender dropdown options.
   */
  const genderOptions = useMemo<DropdownOption[]>(
    () => [
      {
        value: 'male',
        label: 'Male',
      },
      {
        value: 'female',
        label: 'Female',
      },
    ],
    []
  );

  /*
   * Update a form field.
   */
  const updateValue = (fieldName: string, value: string) => {
    setFormValues((previous) => ({
      ...previous,
      [fieldName]: value,
    }));
  };

  /*
   * Remove the fresh-registration flag and return
   * to the application root.
   */
  const handleGoHome = async () => {
    try {
      await storage.deleteItem(FRESH_REGISTRATION);
    } catch (error) {
      console.error('Failed to clear fresh registration flag:', error);
    } finally {
      router.replace('/');
    }
  };

  /*
   * Convert the UI form values into the API payload.
   */
  const formatFields = (values: FormValues): ProfilePayload => {
    switch (role) {
      case 'consultant':
        return {
          gender: values.gender || undefined,

          speciality:
            values.speciality === 'general'
              ? 'general consultant'
              : values.speciality || undefined,

          placeOfWork: values.placeOfWork || undefined,

          yearsOfService: parseOptionalNumber(values.yearsOfService),

          awards: parseOptionalNumber(values.awards),

          costPerSession: parseOptionalNumber(values.costPerSession),

          sessionLength: parseOptionalNumber(values.sessionLength),

          bio: values.bio || undefined,

          licenceNumber: values.licenceNumber || undefined,
        };

      case 'lab':
        return {
          name: values.name || undefined,

          address: values.address || undefined,

          yearsOfService: parseOptionalNumber(values.yearsOfService),

          awards: parseOptionalNumber(values.awards),

          registrationNumber: values.registrationNumber || undefined,

          about: values.about || undefined,
        };

      case 'pharmacy':
        return {
          name: values.name || undefined,

          address: values.address || undefined,

          yearsOfService: parseOptionalNumber(values.yearsOfService),

          awards: parseOptionalNumber(values.awards),

          registrationNumber: values.registrationNumber || undefined,

          about: values.about || undefined,
        };

      default:
        return {};
    }
  };

  /*
   * Submit profile information and profile picture.
   */
  const handleSubmit = async () => {
    if (!role || !token) {
      Alert.alert(
        'Authentication error',
        'Your session has expired. Please log in again.'
      );
      return;
    }

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = removeUnsetFields(formatFields(formValues));

      console.log('Submitting profile:', payload);

      /*
       * Update profile first.
       *
       * This avoids uploading a picture if the profile
       * update itself fails.
       */
      await apiUpdateProfile(payload, token);

      /*
       * Upload the picture only if the user selected one.
       */
      if (pickedImageUri) {
        await apiUploadProfilePicture(pickedImageUri, token);
      }

      /*
       * Profile completion succeeded.
       */
      await storage.deleteItem(FRESH_REGISTRATION);

      router.replace('/');
    } catch (error) {
      console.error('Failed to complete profile:', error);

      Alert.alert(
        'Unable to complete profile',
        'Something went wrong while saving your profile. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
   * Pick a profile image.
   */
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: role === 'consultant' ? [1, 1] : [4, 3],
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
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.xl,
        borderColor: theme.colors.border,
        borderWidth: 1,
        padding: theme.spacing.xl,
        width: '100%',
        maxWidth: 500,
      },

      header: {
        marginBottom: theme.spacing.xl,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },

      upperRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.base,
      },

      upperRowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      },

      upperRowItemText: {
        fontSize: theme.typography.sizes.md,
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

      avatarSq: {
        width: '100%',
        maxWidth: 360,
        aspectRatio: 4 / 3,
        borderRadius: theme.radius.md,
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

      title: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.xl,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
      },

      subtitle: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
      },

      roleTag: {
        fontFamily: theme.typography.fonts?.sans,
        color: theme.colors.primary.extraDeep,
        marginLeft: theme.spacing.md,
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

      submitButton: {
        width: '100%',
        minHeight: 50,
        marginTop: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.primary.deep,
        alignItems: 'center',
        justifyContent: 'center',
      },

      submitButtonText: {
        color: '#fff',
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.md,
        fontWeight: '600',
      },

      disabledButton: {
        opacity: 0.5,
      },

      skipButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
      },

      skipButtonText: {
        color: theme.colors.textMuted,
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
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

  /*
   * Handle an unknown role.
   */
  if (!role) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <ThemedText type="title">
            Unable to determine your account type
          </ThemedText>

          <ThemedText
            style={{
              marginTop: 8,
              color: styles.subtitle.color,
            }}
          >
            Please return to the previous screen and select your account type.
          </ThemedText>

          <Pressable style={styles.skipButton} onPress={handleGoHome}>
            <ThemedText style={styles.skipButtonText}>Go back</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

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
            {/* Top navigation */}
            <View>
              <View style={styles.upperRow}>
                <Pressable
                  style={styles.upperRowItem}
                  onPress={() => router.back()}
                  disabled={isSubmitting}
                >
                  <IconSymbol
                    name="chevron.left"
                    color={appTheme.colors.textMuted}
                    size={16}
                  />

                  <ThemedText style={styles.upperRowItemText}>Back</ThemedText>
                </Pressable>

                <ThemedText>Profile</ThemedText>

                {freshReg ? (
                  <Pressable
                    style={styles.upperRowItem}
                    onPress={handleGoHome}
                    disabled={isSubmitting}
                  >
                    <ThemedText style={styles.upperRowItemText}>
                      Skip
                    </ThemedText>

                    <IconSymbol
                      name="chevron.right"
                      color={appTheme.colors.textMuted}
                      size={16}
                    />
                  </Pressable>
                ) : (
                  <View style={styles.upperRowItem} />
                )}
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
                    <Image
                      source={{
                        uri: avatarUri,
                      }}
                      style={
                        role === 'consultant' ? styles.avatar : styles.avatarSq
                      }
                    />
                  ) : (
                    <View
                      style={[
                        role === 'consultant' ? styles.avatar : styles.avatarSq,
                        styles.avatarPlaceholder,
                      ]}
                    />
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
                  Tap to change photo
                </ThemedText>
              </View>
            </View>

            {/* Form */}
            {Object.entries(formFields).map(([fieldName, field]) => {
              const value = formValues[fieldName] ?? '';

              /*
               * Dropdown field
               */
              if (field.type === 'dropdown') {
                let options: DropdownOption[] = [];

                if (fieldName === 'gender') {
                  options = genderOptions;
                } else if (fieldName === 'speciality') {
                  options = specialityOptions;
                }

                return (
                  <View key={fieldName} style={styles.fieldContainer}>
                    <Dropdown
                      label={formatFieldName(fieldName)}
                      value={value}
                      placeholder={field.placeholder}
                      options={options}
                      isOpen={openDropdown === fieldName}
                      onOpenChange={(open) =>
                        setOpenDropdown(open ? fieldName : null)
                      }
                      onChange={(selectedValue) => {
                        updateValue(fieldName, selectedValue);
                        setOpenDropdown(null);
                      }}
                    />
                  </View>
                );
              }

              /*
               * Text / number field
               */
              const isTextArea = fieldName === 'bio' || fieldName === 'about';

              return (
                <View key={fieldName} style={styles.fieldContainer}>
                  <ThemedText style={styles.label}>
                    {formatFieldName(fieldName)}
                  </ThemedText>

                  <TextInput
                    value={value}
                    placeholder={field.placeholder}
                    placeholderTextColor={appTheme.colors.textMuted}
                    keyboardType={
                      field.type === 'number' ? 'numeric' : 'default'
                    }
                    multiline={isTextArea}
                    numberOfLines={isTextArea ? 5 : 1}
                    style={[styles.input, isTextArea && styles.textArea]}
                    editable={!isSubmitting}
                    onFocus={() => setOpenDropdown(null)}
                    onChangeText={(text) => updateValue(fieldName, text)}
                  />
                </View>
              );
            })}

            {/* Submit */}
            <Pressable
              disabled={isSubmitting}
              style={[
                styles.submitButton,
                isSubmitting && styles.disabledButton,
              ]}
              onPress={handleSubmit}
            >
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />

                  <ThemedText style={styles.submitButtonText}>
                    Saving...
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.submitButtonText}>
                  Complete Profile
                </ThemedText>
              )}
            </Pressable>

            {/* Bottom skip */}
            {freshReg && (
              <Pressable
                style={styles.skipButton}
                onPress={handleGoHome}
                disabled={isSubmitting}
              >
                <ThemedText style={styles.skipButtonText}>
                  Complete this later
                </ThemedText>
              </Pressable>
            )}
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
