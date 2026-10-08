import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  AppointmentData,
  PaymentLinkAppointmentData,
  ProfileFields,
  apiGetOneAppointment,
  apiGetProfileById,
} from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';
import { Theme } from '@/theme/types';
import { truncate } from '@/utils';
import { getAge } from '@/utils/formatter';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const bannerConfig = (status: string, theme: Theme): Record<string, any> => {
  switch (status) {
    case 'confirmed':
      return {
        message:
          'Your appointment is confirmed, you can proceed to make payment if you have not done so already.',
        icon: 'check-circle',
        color: theme.colors.textSecondary,
        borderColor: theme.colors.textSecondary,
        bgColor: 'transparent',
      };
    case 'pending':
      return {
        message:
          'Your appointment is pending doctors confirmation. Once confirmed, you will be notified with a payment link.',
        icon: 'schedule',
        color: theme.colors.warning,
        borderColor: theme.colors.warning,
        bgColor: theme.colors.warningBg,
      };
    case 'cancelled':
      return {
        message: 'Your appointment has been cancelled.',
        icon: 'cancel',
        color: theme.colors.danger,
        borderColor: theme.colors.danger,
        bgColor: theme.colors.dangerBg,
      };
    case 'completed':
      return {
        message: 'Your appointment has been completed.',
        icon: 'check-circle',
        color: theme.colors.success,
        borderColor: theme.colors.success,
        bgColor: theme.colors.successBg,
      };
    default:
      return {
        message:
          'Your appointment is confirmed, you can proceed to make payment if you have not done so already.',
        icon: 'check-circle',
        color: theme.colors.blue.base,
        borderColor: theme.colors.blue.base,
        bgColor: theme.colors.blue.deep,
      };
  }
};

const getPaymentStatusStyle = (
  status: string,
  theme: Theme
): Record<string, any> => {
  switch (status) {
    case 'payment_confirmed':
      return { color: theme.colors.success, bgColor: theme.colors.successBg };
    case 'payment_completed':
      return { color: theme.colors.success, bgColor: theme.colors.successBg };
    case 'payment_pending':
      return { color: theme.colors.warning, bgColor: theme.colors.warningBg };
    case 'payment_failed':
      return { color: theme.colors.danger, bgColor: theme.colors.dangerBg };
    case 'payment_cancelled':
      return { color: theme.colors.danger, bgColor: theme.colors.dangerBg };
    default:
      return { color: theme.colors.success, bgColor: theme.colors.successBg };
  }
};

const BookingDetailsScreen = () => {
  const { token, user, profile } = useAuth();

  const { id: bookingId } = useLocalSearchParams();
  // const bookingId = route.params?.bookingId;
  const doctorId = user?.id;
  const docData = profile?.profile;

  const [patient, setPatient] = useState<ProfileFields | null>(null);
  const [appt, setAppt] = useState<
    AppointmentData | PaymentLinkAppointmentData | null
  >(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [banner, setBanner] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { theme: appTheme } = useTheme();

  useEffect(() => {
    if (!doctorId || !token) {
      return;
    }

    apiGetOneAppointment(bookingId as string, token)
      .then((res) => {
        setAppt(res);
        apiGetProfileById(res.patient_id, 'patient', token)
          .then((res) => setPatient(res.profile))
          .catch((e) => setError(e.message ?? 'Failed to load profile'));
        setBanner(bannerConfig(res.status, appTheme));
      })
      .catch((e) => setError(e.message ?? 'Failed to load appointment'))
      .finally(() => setLoading(false));
  }, [doctorId, token, bookingId, appTheme]);

  const handleReload = () => {
    setLoading(true);
    setError(null);
    if (doctorId && token) {
      apiGetOneAppointment(bookingId as string, token)
        .then((res) => {
          setAppt(res);
          apiGetProfileById(res.patient_id, 'patient', token)
            .then((res) => setPatient(res.profile))
            .catch((e) => setError(e.message ?? 'Failed to load profile'));
          setBanner(bannerConfig(res.status, appTheme));
        })
        .catch((e) => setError(e.message ?? 'Failed to load appointment'))
        .finally(() => setLoading(false));
    }
  };

  const fullName = patient
    ? [patient.firstName, patient.lastName].filter(Boolean).join(' ')
    : 'Unnamed Patient';

  const apptType = appt?.description?.includes('–')
    ? appt.description.split('–')[0].trim()
    : 'Consultation';

  const apptDesc = appt?.description?.includes('–')
    ? appt.description.split('–')[1].trim()
    : appt?.description;

  const paymentStatusInfo = appt?.paymentStatus
    ? getPaymentStatusStyle(appt.paymentStatus.toLowerCase(), appTheme)
    : {
        color: appTheme.colors.textMuted,
        bgColor: appTheme.colors.surfaceCard,
      };

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

  // const handleVerifyPayment = async () => {
  //   const response = await apiVerifyTransaction(
  //     paymentData.reference,
  //     token || ''
  //   );
  //   if (response.status) {
  //     handleReload();
  //   }
  // };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/appointments');
  };

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingVertical: theme.spacing.xxl,
      },
      center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
      scroll: { padding: theme.spacing.base, paddingBottom: 48 },

      sectionTitle: {
        fontFamily: theme.typography.fonts?.rounded,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.textSecondary,
        marginBottom: 2,
      },
      sectionSubtitle: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
      },

      banner: {
        backgroundColor: theme.colors.primary.shallow,
        padding: theme.spacing.md,
        borderRadius: theme.radius.xl,
        marginBottom: theme.spacing.base,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
      },

      bannerText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        paddingRight: theme.spacing.lg,
        color: theme.colors.primary.deep,
        textAlign: 'left',
      },

      heroCard: {
        backgroundColor: theme.colors.surfaceCardLight,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.base,
        marginBottom: theme.spacing.base,
      },

      heroInner: {
        flexDirection: 'row',
        alignItems: 'center',
      },

      upperRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.base,
        paddingVertical: theme.spacing.sm,
      },

      upperRowItem: {
        position: 'absolute',
        top: 7,
        left: 10,
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

      avatarWrapper: { marginRight: theme.spacing.md },
      avatarImage: {
        width: 90,
        height: 90,
        borderRadius: 45,
      },
      avatarPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: theme.colors.primary.shallow,
        alignItems: 'center',
        justifyContent: 'center',
      },
      heroInfo: { flex: 1 },
      doctorName: {
        fontFamily: theme.typography.fonts?.rounded,
        fontSize: theme.typography.sizes.lg,
        color: theme.colors.textSecondary,
        marginBottom: 2,
      },
      doctorMeta: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
        marginBottom: 4,
        textTransform: 'capitalize',
      },
      card: {
        backgroundColor: theme.colors.surfaceCardLight,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.base,
        marginBottom: theme.spacing.lg,
      },
      visitInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
      },
      visitInfoIcon: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.full,
        marginRight: theme.spacing.md,
      },
      visitInfoContent: { flex: 1 },
      visitInfoLabel: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.textMuted,
      },
      visitInfoText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
      },
      visitInfoDesc: {
        flexDirection: 'column',
        gap: theme.spacing.sm,
      },
      visitInfoDescLabel: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.text,
      },
      visitInfoDescText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
        backgroundColor: theme.colors.surfaceCardLight,
        padding: theme.spacing.sm,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      navArrow: {
        width: 'auto',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignContent: 'center',
        padding: theme.spacing.sm,
      },
      navArrowText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.primary.extraDeep,
        marginRight: theme.spacing.xs,
        textAlignVertical: 'center',
      },
      uploadedFile: {
        flexDirection: 'column',
        alignItems: 'center',
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.surfaceCardLight,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      uploadedFileName: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
        marginLeft: theme.spacing.sm,
      },
      paymentInfoCard: {
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.base,
        marginBottom: theme.spacing.base,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      paymentInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      paymentInfoLabel: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.textMuted,
      },
      paymentInfoValue: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
      },
      paymentInfoTotalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.md,
      },
      paymentInfoTotalLabel: {
        fontFamily: theme.typography.fonts?.rounded,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.textSecondary,
      },
      paymentInfoTotalValue: {
        fontFamily: theme.typography.fonts?.rounded,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.textSecondary,
      },
      paymentInfoRowLast: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
      },
      paymentStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.md,
      },
      paymentStatusBadge: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.full,
      },
      paymentStatusBadgeText: {
        fontFamily: theme.typography.fonts?.rounded,
        fontSize: theme.typography.sizes.xs,
        textTransform: 'capitalize',
      },
      payNowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.successBg,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginTop: theme.spacing.sm,
        width: '48%',
      },
      payNowBtnText: {
        fontFamily: theme.typography.fonts?.rounded,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.mono.light,
      },

      verifyPaymentBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.blue.deep,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.blue.extraDeep,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginTop: theme.spacing.sm,
        width: '48%',
      },
      verifyPaymentBtnText: {
        fontFamily: theme.typography.fonts?.rounded,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.mono.light,
      },

      rescheduleBtn: {
        backgroundColor: theme.colors.primary.extraDeep,
        marginTop: theme.spacing.md,
        color: theme.colors.mono.light,
      },
      cancelBtn: {
        backgroundColor: theme.colors.dangerBg,
        marginTop: theme.spacing.md,
        color: theme.colors.danger,
        borderColor: theme.colors.danger,
        borderWidth: 1,
      },
    })
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={appTheme.colors.primary.extraDeep}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.upperRow}>
          <Pressable style={styles.upperRowItem} onPress={handleGoBack}>
            <IconSymbol
              name="chevron.left"
              color={appTheme.colors.textMuted}
              size={16}
            />

            <ThemedText style={styles.upperRowItemText}>Back</ThemedText>
          </Pressable>

          <ThemedText style={styles.upperRowText}>Appointment</ThemedText>
        </View>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={handleReload} />
          }
        >
          {/* Banner */}
          {/* {banner && (
            <View
              style={[
                styles.banner,
                {
                  borderColor: banner
                    ? banner.borderColor
                    : appTheme.colors.primary.extraDeep,
                  backgroundColor: banner
                    ? banner.bgColor
                    : appTheme.colors.primary.shallow,
                },
              ]}
            >
              <IconSymbol
                name={banner ? banner.icon : 'checkmark'}
                size={24}
                color={banner ? banner.color : appTheme.colors.text}
              />
              <Text
                style={[
                  styles.bannerText,
                  { color: banner ? banner.color : appTheme.colors.text },
                ]}
              >
                {banner ? banner.message : 'confirmed'}
              </Text>
            </View>
          )} */}

          {/* Doctors card */}
          <View style={styles.heroCard}>
            <View style={styles.heroInner}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: '/patients/[id]',
                    params: { id: patient?.user_id ?? '' },
                  })
                }
                style={styles.avatarWrapper}
              >
                {patient?.profilePicture?.url ? (
                  <Image
                    source={{ uri: patient.profilePicture.url }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <IconSymbol
                      name="person.fill"
                      size={52}
                      color={appTheme.colors.primary.mid}
                    />
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.heroInfo}>
                <Text style={styles.doctorName}>{fullName}</Text>
                <Text style={styles.doctorMeta}>
                  {[
                    patient?.gender,
                    patient?.dateOfBirth
                      ? `${getAge(patient.dateOfBirth, 'yrs')}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            </View>
          </View>

          {/* Visit Information */}
          <View style={styles.card}>
            <View>
              <Text style={styles.sectionTitle}>Booking Details</Text>
              <Text style={styles.sectionSubtitle}>
                Here are the details of your appointment booking.
              </Text>
            </View>
            <View style={styles.visitInfoRow}>
              <View style={styles.visitInfoIcon}>
                <IconSymbol
                  name="calendar.badge"
                  size={24}
                  color={appTheme.colors.primary.deep}
                />
              </View>
              <View style={styles.visitInfoContent}>
                <Text style={styles.visitInfoLabel}>Appointment Type</Text>
                <Text style={styles.visitInfoText}>{apptType}</Text>
              </View>
            </View>
            <View style={styles.visitInfoRow}>
              <View style={styles.visitInfoIcon}>
                <IconSymbol
                  name="calendar.badge"
                  size={24}
                  color={appTheme.colors.primary.deep}
                />
              </View>
              <View style={styles.visitInfoContent}>
                <Text style={styles.visitInfoLabel}>Date</Text>
                <Text style={styles.visitInfoText}>{appointmentDate}</Text>
              </View>
            </View>
            <View style={styles.visitInfoRow}>
              <View style={styles.visitInfoIcon}>
                <IconSymbol
                  name="pin.fill"
                  size={24}
                  color={appTheme.colors.primary.deep}
                />
              </View>
              <View style={styles.visitInfoContent}>
                <Text style={styles.visitInfoLabel}>Location</Text>
                <Text style={styles.visitInfoText}>Online</Text>
              </View>
            </View>
            <View style={styles.visitInfoRow}>
              <View style={styles.visitInfoIcon}>
                <IconSymbol
                  name="alarm.fill"
                  size={24}
                  color={appTheme.colors.primary.deep}
                />
              </View>
              <View style={styles.visitInfoContent}>
                <Text style={styles.visitInfoLabel}>Duration</Text>
                <Text style={styles.visitInfoText}>
                  {appt?.sessions && docData?.sessionLength
                    ? appt?.sessions * docData?.sessionLength
                    : 0}{' '}
                  minutes
                </Text>
              </View>
            </View>
            {appt?.paymentStatus === 'payment_confirmed' && (
              <View style={styles.visitInfoRow}>
                <View style={styles.visitInfoIcon}>
                  <IconSymbol
                    name="videoprojector.fill"
                    size={24}
                    color={appTheme.colors.primary.deep}
                  />
                </View>
                <View style={styles.visitInfoContent}>
                  <Text style={styles.visitInfoLabel}>Meeting Link</Text>
                  <Text style={styles.visitInfoText}>
                    {truncate(appt?.join_link || '', 30)}
                  </Text>
                </View>
                <TouchableOpacity
                  // onPress={() =>
                  //   router.navigate('/ZoomMeeting', {
                  //     appointmentId: appt!.id,
                  //     meetingNumber: String(appt!.meeting_id),
                  //     meetingPassword: appt!.meeting_password,
                  //     joinLink: appt?.join_link,
                  //     meetingLink: appt?.meeting_link,
                  //   })
                  // }
                  disabled={!appt?.meeting_id}
                  style={styles.navArrow}
                >
                  <Text style={styles.navArrowText}>Join</Text>
                  <IconSymbol
                    name="chevron.right"
                    size={20}
                    color={appTheme.colors.primary.extraDeep}
                  />
                </TouchableOpacity>
              </View>
            )}
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
          {/* {appt?.status === 'completed' && ( */}
          {appt?.status && (
            <View style={{ marginBottom: appTheme.spacing.base }}>
              <Button
                label="Reports and Review"
                onPress={() => {}}
                loading={loading}
                disabled={!appt?.provider_id}
                style={styles.rescheduleBtn}
              />
            </View>
          )}

          {/* Uploaded Files */}
          <View style={styles.card}>
            <View>
              <Text style={styles.sectionTitle}>Uploaded Files</Text>
              <Text style={styles.sectionSubtitle}>
                Here are the files uploaded for the appointment.
              </Text>
            </View>
            <View style={styles.uploadedFile}>
              <IconSymbol
                name="folder.circle.fill"
                size={36}
                color={appTheme.colors.primary.base}
              />
              <Text style={styles.uploadedFileName}>No documents uploaded</Text>
            </View>
          </View>

          {/* Payment Information */}
          <View>
            <View>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              <Text style={styles.sectionSubtitle}>
                Here is the payment details for your appointment.
              </Text>
            </View>
            <View style={styles.paymentInfoCard}>
              <View style={styles.paymentInfoRow}>
                <Text style={styles.paymentInfoLabel}>Consulation fee</Text>
                <Text style={styles.paymentInfoValue}>
                  ₦{appt?.sessionCost || '0.00'}
                </Text>
              </View>
              <View style={styles.paymentInfoRow}>
                <Text style={styles.paymentInfoLabel}>Sessions</Text>
                <Text style={styles.paymentInfoValue}>
                  {appt?.sessions || 1}
                </Text>
              </View>
              <View style={styles.paymentInfoTotalRow}>
                <Text style={styles.paymentInfoTotalLabel}>Total</Text>
                <Text style={styles.paymentInfoTotalValue}>
                  ₦
                  {((appt?.sessionCost || 0.0) * (appt?.sessions || 1)).toFixed(
                    2
                  )}
                </Text>
              </View>
              <View style={styles.paymentStatusRow}>
                <Text style={styles.paymentInfoLabel}>Payment Status</Text>
                <View
                  style={[
                    styles.paymentStatusBadge,
                    { backgroundColor: paymentStatusInfo.bgColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.paymentStatusBadgeText,
                      { color: paymentStatusInfo.color },
                    ]}
                  >
                    {appt?.paymentStatus?.split('_').join(' ') || 'Unpaid'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={{}}>
            <Button
              label={
                appt?.status === 'confirmed'
                  ? 'Join meeting'
                  : 'Accept Appointment'
              }
              // onPress={() =>
              //   router.navigate('/reschedule', {
              //     providerId: appt?.provider_id,
              //   })
              // }
              onPress={() => {}}
              loading={loading}
              disabled={
                (appt?.status === 'confirmed' &&
                  appt?.paymentStatus !== 'payment_confirmed') ||
                !appt?.provider_id
              }
              style={styles.rescheduleBtn}
            />
            <Button
              label="Cancel Appointment"
              // onPress={() =>
              //   router.navigate('/cancel-appointment', {
              //     providerId: appt?.provider_id,
              //   })
              // }
              onPress={() => {}}
              loading={loading}
              disabled={!appt?.provider_id}
              style={styles.cancelBtn}
              textStyle={{ color: appTheme.colors.danger }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BookingDetailsScreen;
