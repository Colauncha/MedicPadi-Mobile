import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { colors, radius, spacing, typography } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { StarRating } from '../../components/StarRating';
// import { truncate } from '../../utils';
import { useEffect, useState } from 'react';
import {
  apiGetOneAppointment,
  AppointmentData,
  ProfileData,
  apiGetProfileById,
  apiSubmitReview,
  ReviewProfileType,
} from '../../services/api';
import { RouteProp, useRoute } from '@react-navigation/core';
import { PatientStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';

type Route = RouteProp<PatientStackParamList, 'CompleteAppointment'>;

export const CompleteAppointmentScreen = () => {
  const route = useRoute<Route>();
  const { token } = useAuth();

  const [appt, setAppt] = useState<AppointmentData | null>(null);
  const [doctor, setDoctor] = useState<ProfileData | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookingId = route.params?.id || '';
  const doctorId = route.params?.doctorId || ';';

  useEffect(() => {
    apiGetOneAppointment(bookingId, token || '')
      .then((res) => setAppt(res))
      .catch((e) => setError(e.message ?? 'Failed to load appointment'))
      .finally(() => setLoading(false));
  }, [bookingId, token]);

  useEffect(() => {
    let providerId = doctorId || appt?.provider_id || '';
    apiGetProfileById(providerId, 'consultant', token || '')
      .then((res) => setDoctor(res))
      .catch((e) => setError(e.message ?? 'Failed to load doctor'))
      .finally(() => setLoading(false));
  }, [appt, doctorId, token]);

  const handleSubmitReview = async () => {
    if (!rating || !review?.trim()) {
      Alert.alert('Invalid input', 'Review and Rating required.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiSubmitReview(
        appt?.id || '',
        {
          message: review,
          rating,
          profile_type: ReviewProfileType.Doctor,
          doctor_id: appt?.provider_id,
        },
        token || ''
      );
      if (response) {
        Alert.alert(
          'Review Submitted',
          'Review and Rating has been submitted successfully.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const apptType = appt?.description?.includes('–')
    ? appt.description.split('–')[0].trim()
    : 'Consultation';

  const appointmentDate = appt?.appointment_time
    ? new Date(appt.appointment_time).toLocaleString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  const fullName = doctor
    ? [doctor.profile.firstName, doctor.profile.lastName]
        .filter(Boolean)
        .join(' ')
    : '—';

  const apptDesc = appt?.description?.includes('–')
    ? appt.description.split('–')[1].trim()
    : appt?.description;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="My Appointment" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary[950]} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="My Appointment" />
        <View style={styles.center}>
          <Text>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Post Appointment" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          // refreshControl={
          //   <RefreshControl refreshing={loading} onRefresh={handleReload} />
          // }
        >
          {/* Booking Info */}
          <View style={styles.card}>
            <View>
              <Text style={styles.sectionTitle}>Appointment Details</Text>
              <Text style={styles.sectionSubtitle}>
                Here are the details for the appointment.
              </Text>
            </View>
            <View style={styles.visitInfoRow}>
              <View style={styles.visitInfoIcon}>
                <MaterialIcons
                  name="event"
                  size={24}
                  color={colors.primary[900]}
                />
              </View>
              <View style={styles.visitInfoContent}>
                <Text style={styles.visitInfoLabel}>Appointment Type</Text>
                <Text style={styles.visitInfoText}>{apptType}</Text>
              </View>
            </View>
            <View style={styles.visitInfoRow}>
              <View style={styles.visitInfoIcon}>
                <MaterialIcons
                  name="calendar-today"
                  size={24}
                  color={colors.primary[900]}
                />
              </View>
              <View style={styles.visitInfoContent}>
                <Text style={styles.visitInfoLabel}>Date</Text>
                <Text style={styles.visitInfoText}>{appointmentDate}</Text>
              </View>
            </View>
            <View style={styles.visitInfoRow}>
              <View style={styles.visitInfoIcon}>
                <MaterialIcons
                  name="pin-drop"
                  size={24}
                  color={colors.primary[900]}
                />
              </View>
              <View style={styles.visitInfoContent}>
                <Text style={styles.visitInfoLabel}>Location</Text>
                <Text style={styles.visitInfoText}>Online</Text>
              </View>
            </View>
            <View style={styles.visitInfoRow}>
              <View style={styles.visitInfoIcon}>
                <MaterialIcons
                  name="alarm"
                  size={24}
                  color={colors.primary[900]}
                />
              </View>
              <View style={styles.visitInfoContent}>
                <Text style={styles.visitInfoLabel}>Duration</Text>
                <Text style={styles.visitInfoText}>
                  {appt?.sessions && doctor?.profile?.sessionLength
                    ? appt?.sessions * doctor?.profile?.sessionLength
                    : 0}{' '}
                  minutes
                </Text>
              </View>
            </View>
            <View style={styles.visitInfoDesc}>
              <Text style={styles.visitInfoDescLabel}>
                Reason for appointment
              </Text>
              <TextInput
                style={styles.visitInfoDescText}
                value={apptDesc}
                editable={false}
                multiline
              />
            </View>
          </View>

          {/* Reports  */}

          {/* Review setup */}
          <View>
            <View>
              <Text style={styles.sectionTitle}>Review and Rating</Text>
              <Text style={styles.sectionSubtitle}>
                Rate and review the provider.
              </Text>
            </View>
            <View style={styles.TransparentCard}>
              <View style={styles.ratingInner}>
                <View>
                  <View style={styles.docorData}>
                    <View style={styles.avatarWrapper}>
                      {doctor?.profile?.profilePicture?.url ? (
                        <Image
                          source={{ uri: doctor.profile?.profilePicture.url }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <MaterialIcons
                            name="person"
                            size={25}
                            color={colors.primary[200]}
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.heroInfo}>
                      <Text style={styles.doctorName}>
                        {`Dr. ${fullName}` || 'Doctor'}
                      </Text>
                      <Text style={styles.doctorMeta}>
                        {[
                          doctor?.profile.speciality,
                          doctor?.profile.yearsOfService
                            ? `${doctor?.profile.yearsOfService} yrs`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                      <Text style={styles.doctorMeta}>
                        {[
                          `${doctor?.profile.totalReviews} reviews`,
                          `${doctor?.profile.rating} rating`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                  </View>
                </View>
                <View>
                  <View style={styles.starLine}>
                    <Text style={{ color: colors.text.light }}>
                      Rate the service: {rating}
                    </Text>
                    <StarRating
                      rating={rating}
                      onRatingChange={(rating) => setRating(rating)}
                      color={colors.primary[950]}
                      size={18}
                    />
                  </View>
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      multiline={true}
                      numberOfLines={4}
                      placeholder="Enter your review..."
                      placeholderTextColor={colors.text.light}
                      onChangeText={(text) => setReview(text)}
                      style={[
                        styles.reviewInput,
                        { height: 100, textAlignVertical: 'top' },
                      ]}
                    />
                    <Button
                      label="Submit"
                      onPress={handleSubmitReview}
                      loading={submitting}
                      disabled={submitting || !review?.trim() || !rating}
                      style={styles.submitButton}
                      textStyle={{ color: colors.text.white }}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.base, paddingBottom: 48 },

  sectionTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.cardBlue,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  visitInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  visitInfoIcon: {
    padding: spacing.md,
    backgroundColor: colors.primary[200],
    borderRadius: radius.full,
    marginRight: spacing.md,
  },
  visitInfoContent: { flex: 1 },
  visitInfoLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.medium,
  },
  visitInfoText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  visitInfoDesc: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  visitInfoDescLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.light,
  },
  visitInfoDescText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    backgroundColor: colors.cardLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  navArrow: {
    width: 'auto',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignContent: 'center',
    padding: spacing.sm,
  },
  navArrowText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.primary[950],
    marginRight: spacing.xs,
    textAlignVertical: 'center',
  },
  TransparentCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },

  // Ratings
  ratingInner: {
    flexDirection: 'column',
    gap: spacing.base,
  },
  avatarWrapper: { marginRight: spacing.md },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: { flex: 1 },
  docorData: { flexDirection: 'row' },
  doctorName: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.lg,
    color: colors.text.dark,
    marginBottom: 2,
  },
  doctorMeta: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  starLine: {
    flexDirection: 'row',
    gap: spacing.base,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderRadius: spacing.base,
    color: colors.text.dark,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  submitButton: {
    width: '50%',
    left: '50%',
  },
});
