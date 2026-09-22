import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/core';
import { useAuth } from '../../context/AuthContext';
import {
  AppointmentData,
  PaymentLinkAppointmentData,
  ProfileFields,
  apiGetOneAppointment,
  apiGetProfileById,
  apiVerifyTransaction,
} from '../../services/api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { truncate } from '../../utils';

export type Nav = NativeStackNavigationProp<PatientStackParamList>;
export type Route = RouteProp<PatientStackParamList, 'BookingDetails'>;

const BANNER_CONFIG: Record<string, any> = {
  confirmed: {
    message:
      'Your appointment is confirmed, you can proceed to make payment if you have not done so already.',
    icon: 'check-circle',
    color: colors.blue[600],
    borderColor: colors.blue[600],
    bgColor: colors.blue[50],
  },
  pending: {
    message:
      'Your appointment is pending doctors confirmation. Once confirmed, you will be notified with a payment link.',
    icon: 'schedule',
    color: colors.warn[600],
    borderColor: colors.warn[600],
    bgColor: colors.warn[100],
  },
  cancelled: {
    message: 'Your appointment has been cancelled.',
    icon: 'cancel',
    color: colors.error[500],
    borderColor: colors.error[500],
    bgColor: colors.error[100],
  },
  completed: {
    message: 'Your appointment has been completed.',
    icon: 'check-circle',
    color: colors.green[500],
    borderColor: colors.green[500],
    bgColor: colors.green[100],
  },
};

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { color: string; bgColor: string }
> = {
  payment_confirmed: { color: colors.green[600], bgColor: colors.green[100] },
  payment_completed: { color: colors.green[600], bgColor: colors.green[100] },
  payment_pending: { color: colors.warn[600], bgColor: colors.warn[100] },
  payment_failed: { color: colors.error[500], bgColor: colors.error[100] },
  payment_cancelled: { color: colors.error[500], bgColor: colors.error[100] },
};

export const BookingDetailsScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { token } = useAuth();
  const bookingId = route.params?.bookingId;
  const doctorId = route.params?.doctorId;
  const docData = route.params?.doctorData || null;
  const apptData = route.params?.apptData || null;

  const [doctor, setDoctor] = useState<ProfileFields | null>(null);
  const [appt, setAppt] = useState<
    AppointmentData | PaymentLinkAppointmentData | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<
    (typeof BANNER_CONFIG)[keyof typeof BANNER_CONFIG] | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!doctorId || !token) {
      setLoading(false);
      return;
    }
    if (docData) {
      setDoctor(docData);
      setLoading(false);
      return;
    }
    if (apptData) {
      setAppt(apptData);
      setLoading(false);
      return;
    }
    apiGetProfileById(doctorId, 'consultant', token)
      .then((res) => setDoctor(res.profile))
      .catch((e) => setError(e.message ?? 'Failed to load profile'))
      .finally(() => setLoading(false));

    apiGetOneAppointment(bookingId, token)
      .then((res) => setAppt(res))
      .catch((e) => setError(e.message ?? 'Failed to load appointment'))
      .finally(() => setLoading(false));
  }, [doctorId, token, docData, apptData]);

  const handleReload = () => {
    setLoading(true);
    setError(null);
    if (doctorId && token) {
      apiGetProfileById(doctorId, 'consultant', token)
        .then((res) => setDoctor(res.profile))
        .catch((e) => setError(e.message ?? 'Failed to load profile'))
        .finally(() => setLoading(false));
    }
    if (bookingId && token) {
      apiGetOneAppointment(bookingId, token)
        .then((res) => setAppt(res))
        .catch((e) => setError(e.message ?? 'Failed to load appointment'))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    if (appt) {
      switch (appt.status) {
        case 'confirmed':
          setBanner(BANNER_CONFIG.confirmed);
          break;
        case 'pending':
          setBanner(BANNER_CONFIG.pending);
          break;
        case 'cancelled':
          setBanner(BANNER_CONFIG.cancelled);
          break;
        case 'completed':
          setBanner(BANNER_CONFIG.completed);
          break;
        default:
          setBanner(null);
      }
    }
  }, [appt]);

  useEffect(() => {
    console.log('Doctor:', doctor);
    // console.log('Appointment:', appt);
  }, [doctor, appt]);

  const fullName = doctor
    ? [doctor.firstName, doctor.lastName].filter(Boolean).join(' ')
    : '—';

  const apptType = appt?.description?.includes('–')
    ? appt.description.split('–')[0].trim()
    : 'Consultation';

  const apptDesc = appt?.description?.includes('–')
    ? appt.description.split('–')[1].trim()
    : appt?.description;

  const paymentStatusInfo = appt?.paymentStatus
    ? (PAYMENT_STATUS_CONFIG[appt.paymentStatus.toLowerCase()] ?? {
        color: colors.text.light,
        bgColor: colors.card,
      })
    : { color: colors.text.light, bgColor: colors.card };

  const paymentLink =
    appt && 'authorization_url' in appt
      ? (appt as PaymentLinkAppointmentData)
      : null;

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

  const paymentData = appt as PaymentLinkAppointmentData;

  const handleVerifyPayment = async () => {
    const response = await apiVerifyTransaction(
      paymentData.reference,
      token || ''
    );
    if (response.status) {
      handleReload();
    }
  };

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
      <Header title="My Appointment" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={handleReload} />
          }
        >
          {/* Banner */}
          {banner && (
            <View
              style={[
                styles.banner,
                {
                  borderColor: banner
                    ? banner.borderColor
                    : colors.primary[200],
                  backgroundColor: banner ? banner.bgColor : colors.primary[50],
                },
              ]}
            >
              <MaterialIcons
                name={banner ? banner.icon : 'info'}
                size={24}
                color={banner ? banner.color : colors.text.light}
              />
              <Text
                style={[
                  styles.bannerText,
                  { color: banner ? banner.color : colors.text.light },
                ]}
              >
                {banner ? banner.message : 'confirmed'}
              </Text>
            </View>
          )}

          {/* Doctors card */}
          <View style={styles.heroCard}>
            <View style={styles.heroInner}>
              <View style={styles.avatarWrapper}>
                {doctor?.profilePicture?.url ? (
                  <Image
                    source={{ uri: doctor.profilePicture.url }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <MaterialIcons
                      name="person"
                      size={52}
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
                    doctor?.speciality,
                    doctor?.yearsOfService
                      ? `${doctor.yearsOfService} yrs`
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
                  {appt?.sessions && doctor?.sessionLength
                    ? appt?.sessions * doctor?.sessionLength
                    : 0}{' '}
                  minutes
                </Text>
              </View>
            </View>
            {appt?.paymentStatus === 'payment_confirmed' && (
              <View style={styles.visitInfoRow}>
                <View style={styles.visitInfoIcon}>
                  <MaterialIcons
                    name="videocam"
                    size={24}
                    color={colors.primary[900]}
                  />
                </View>
                <View style={styles.visitInfoContent}>
                  <Text style={styles.visitInfoLabel}>Meeting Link</Text>
                  <Text style={styles.visitInfoText}>
                    {truncate(appt?.join_link || '', 30)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('ZoomMeeting', {
                      appointmentId: appt!.id,
                      meetingNumber: String(appt!.meeting_id),
                      meetingPassword: appt!.meeting_password,
                      joinLink: appt?.join_link,
                      meetingLink: appt?.meeting_link,
                    })
                  }
                  disabled={!appt?.meeting_id}
                  style={styles.navArrow}
                >
                  <Text style={styles.navArrowText}>Join</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.primary[950]}
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
            <View style={{ marginBottom: spacing.base }}>
              <Button
                label="Reports and Review"
                onPress={() =>
                  navigation.navigate('CompleteAppointment', {
                    id: appt.id,
                    doctorId: appt?.provider_id,
                  })
                }
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
                Here are the files you have uploaded for your appointment.
              </Text>
            </View>
            <View style={styles.uploadedFile}>
              <MaterialIcons
                name="attachment"
                size={36}
                color={colors.primary[400]}
              />
              <Text style={styles.uploadedFileName}>No documents uploaded</Text>
            </View>
          </View>

          {/* Payment Information */}
          <View>
            <View>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              <Text style={styles.sectionSubtitle}>
                Here are the cost/payment details for your appointment.
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

            {appt?.status === 'confirmed' && paymentLink && (
              <View style={styles.paymentInfoCard}>
                <View style={styles.paymentInfoRow}>
                  <Text style={styles.paymentInfoLabel}>Reference</Text>
                  <Text style={styles.paymentInfoValue}>
                    {paymentLink.reference}
                  </Text>
                </View>
                <View style={styles.paymentInfoRow}>
                  <Text style={styles.paymentInfoLabel}>Access Code</Text>
                  <Text style={styles.paymentInfoValue}>
                    {paymentLink.access_code}
                  </Text>
                </View>
                <View style={styles.paymentInfoRowLast}>
                  <Text style={styles.paymentInfoLabel}>Payment Link</Text>
                  <Text
                    style={styles.paymentInfoValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {truncate(paymentLink.authorization_url, 25)}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row-reverse',
                    gap: 2,
                    width: '100%',
                    justifyContent: 'space-evenly',
                  }}
                >
                  <TouchableOpacity
                    style={styles.payNowBtn}
                    onPress={() =>
                      navigation.navigate('PaymentWebView', {
                        url: paymentLink.authorization_url,
                        reference: paymentLink.reference,
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.payNowBtnText}>Complete Payment</Text>
                    <MaterialIcons
                      name="north-east"
                      size={14}
                      color={colors.white}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.verifyPaymentBtn}
                    onPress={handleVerifyPayment}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.verifyPaymentBtnText}>
                      Verify Payment
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Buttons */}
          <View style={{}}>
            <Button
              label="Reschedule Appointment"
              onPress={() =>
                navigation.navigate('BookAppointment', {
                  providerId: appt?.provider_id,
                })
              }
              loading={loading}
              disabled={!appt?.provider_id}
              style={styles.rescheduleBtn}
            />
            <Button
              label="Cancel Appointment"
              onPress={() =>
                navigation.navigate('BookAppointment', {
                  providerId: appt?.provider_id,
                })
              }
              loading={loading}
              disabled={!appt?.provider_id}
              style={styles.cancelBtn}
              textStyle={{ color: colors.error[500] }}
            />
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

  banner: {
    backgroundColor: colors.primary[100],
    padding: spacing.md,
    borderRadius: radius.xl,
    marginBottom: spacing.base,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bannerText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    paddingRight: spacing.lg,
    color: colors.primary[900],
    textAlign: 'left',
  },

  heroCard: {
    backgroundColor: colors.cardBlue,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  heroInner: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom: spacing.base,
  },
  avatarWrapper: { marginRight: spacing.md },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
  uploadedFile: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.cardLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  uploadedFileName: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginLeft: spacing.sm,
  },
  paymentInfoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  paymentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[200],
  },
  paymentInfoLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.medium,
  },
  paymentInfoValue: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  paymentInfoTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  paymentInfoTotalLabel: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
  },
  paymentInfoTotalValue: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
  },
  paymentInfoRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  paymentStatusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  paymentStatusBadgeText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.xs,
    textTransform: 'capitalize',
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.green[500],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    width: '48%',
  },
  payNowBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.white,
  },

  verifyPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.blue[600],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.blue[700],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    width: '48%',
  },
  verifyPaymentBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.md,
    color: colors.white,
  },

  rescheduleBtn: {
    backgroundColor: colors.primary[950],
    marginTop: spacing.md,
    color: colors.white,
  },
  cancelBtn: {
    backgroundColor: colors.error[100],
    marginTop: spacing.md,
    color: colors.error[500],
    borderColor: colors.error[500],
    borderWidth: 1,
  },
});
