import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  AppointmentData,
  PaymentLinkAppointmentData,
  ProfileFields,
  apiCancelAppointment,
  apiGetOneAppointment,
  apiGetProfileById,
  apiVerifyTransaction,
} from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';
import { Theme } from '@/theme/types';
import { truncate } from '@/utils';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

type Banner = {
  message: string;
  icon: IconSymbolName;
  color: string;
  borderColor: string;
  bgColor: string;
};

const bannerConfig = (status: string, theme: Theme): Banner | null => {
  switch (status) {
    case 'confirmed':
      return {
        message:
          'Your appointment is confirmed, you can proceed to make payment if you have not done so already.',
        icon: 'checkmark',
        color: theme.colors.primary.deep,
        borderColor: theme.colors.primary.deep,
        bgColor: theme.colors.primary.shallow,
      };
    case 'pending':
      return {
        message:
          'Your appointment is pending doctors confirmation. Once confirmed, you will be notified with a payment link.',
        icon: 'clock',
        color: theme.colors.warning,
        borderColor: theme.colors.warning,
        bgColor: theme.colors.warningBg,
      };
    case 'cancelled':
    case 'canceled':
      return {
        message: 'Your appointment has been cancelled.',
        icon: 'xmark',
        color: theme.colors.danger,
        borderColor: theme.colors.danger,
        bgColor: theme.colors.dangerBg,
      };
    case 'completed':
      return {
        message: 'Your appointment has been completed.',
        icon: 'checkmark',
        color: theme.colors.success,
        borderColor: theme.colors.success,
        bgColor: theme.colors.successBg,
      };
    default:
      return null;
  }
};

const getPaymentStatusStyle = (
  status: string,
  theme: Theme
): { color: string; bgColor: string } => {
  switch (status) {
    case 'payment_confirmed':
    case 'payment_completed':
      return { color: theme.colors.success, bgColor: theme.colors.successBg };
    case 'payment_pending':
      return { color: theme.colors.warning, bgColor: theme.colors.warningBg };
    case 'payment_failed':
    case 'payment_cancelled':
      return { color: theme.colors.danger, bgColor: theme.colors.dangerBg };
    default:
      return {
        color: theme.colors.textMuted,
        bgColor: theme.colors.surfaceCard,
      };
  }
};

const BookingDetailsScreen = () => {
  const { token } = useAuth();
  const { id: bookingId } = useLocalSearchParams<{ id: string }>();
  const { theme: appTheme } = useTheme();

  const [doctor, setDoctor] = useState<ProfileFields | null>(null);
  const [appt, setAppt] = useState<
    AppointmentData | PaymentLinkAppointmentData | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!bookingId || !token) return;
    setError(null);
    try {
      const res = await apiGetOneAppointment(bookingId, token);
      setAppt(res);
      if (res.provider) {
        setDoctor(res.provider);
      } else {
        apiGetProfileById(res.provider_id, 'consultant', token)
          .then((doc) => setDoctor(doc.profile))
          .catch(() => setDoctor(null));
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load appointment');
    } finally {
      setLoading(false);
    }
  }, [bookingId, token]);

  useEffect(() => {
    if (!bookingId || !token) return;

    const timeoutId = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [bookingId, token, loadData]);

  const handleReload = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const fullName = doctor
    ? [doctor.firstName, doctor.lastName].filter(Boolean).join(' ')
    : '';
  const doctorName = fullName ? `Dr. ${fullName}` : 'Doctor';

  const status = appt?.status?.toLowerCase() ?? '';
  const banner = bannerConfig(status, appTheme);
  const isPaid = appt?.paymentStatus === 'payment_confirmed';
  const isActive = status === 'pending' || status === 'confirmed';

  const apptType = appt?.description?.includes('–')
    ? appt.description.split('–')[0].trim()
    : 'Consultation';

  const apptDesc = appt?.description?.includes('–')
    ? appt.description.split('–')[1].trim()
    : appt?.description;

  const paymentStatusInfo = getPaymentStatusStyle(
    appt?.paymentStatus?.toLowerCase() ?? '',
    appTheme
  );

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

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/appointments');
  };

  const handleJoinMeeting = () => {
    if (!appt?.id) return;
    router.push({
      pathname: '/appointments/ZoomMeetingScreen',
      params: { appointmentId: appt.id },
    });
  };

  const handleCompletePayment = () => {
    if (!paymentLink) return;
    router.push({
      pathname: '/appointments/PaymentWebViewScreen',
      params: {
        url: paymentLink.authorization_url,
        reference: paymentLink.reference,
      },
    });
  };

  const handleVerifyPayment = async () => {
    if (!paymentLink || !token) return;
    setVerifying(true);
    try {
      const response = await apiVerifyTransaction(
        paymentLink.reference,
        token
      );
      if (response.status && response.data?.status === 'success') {
        await loadData();
      } else {
        Alert.alert(
          'Payment not confirmed',
          'We could not confirm this payment yet. If you have paid, try again in a moment.'
        );
      }
    } catch (e: any) {
      Alert.alert('Verification failed', e?.message ?? 'Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleReschedule = () => {
    if (!appt?.provider_id) return;
    router.push({
      pathname: '/appointments/book',
      params: { providerId: appt.provider_id, doctorName: fullName },
    });
  };

  const handleReview = () => {
    if (!appt?.provider_id) return;
    // router.push({
    //   pathname: '/appointments/book',
    //   params: { providerId: appt.provider_id, doctorName: fullName },
    // });
  };

  const handleCancel = () => {
    if (!appt?.id || !token) return;
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await apiCancelAppointment(appt.id, token);
              await loadData();
            } catch (e: any) {
              Alert.alert(
                'Error',
                e?.message ?? 'Could not cancel appointment.'
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingVertical: theme.spacing.xxl,
      },
      center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
      },
      errorText: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.danger,
        textAlign: 'center',
      },
      scroll: { padding: theme.spacing.base, paddingBottom: 100 },

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
        padding: theme.spacing.md,
        borderRadius: theme.radius.xl,
        marginBottom: theme.spacing.base,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
      },
      bannerText: {
        flex: 1,
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
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
      viewProfile: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.purple.extraDeep,
        textDecorationLine: 'underline',
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
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.sm,
      },
      navArrowText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.primary.extraDeep,
        marginRight: theme.spacing.xs,
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
        gap: theme.spacing.md,
      },
      paymentInfoLabel: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.textMuted,
      },
      paymentInfoValue: {
        flexShrink: 1,
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
      paymentBtnRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
      },
      payNowBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.success,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      },
      payNowBtnText: {
        fontFamily: theme.typography.fonts?.rounded,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.mono.light,
      },
      verifyPaymentBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.blue.deep,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      },
      verifyPaymentBtnText: {
        fontFamily: theme.typography.fonts?.rounded,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.mono.light,
      },

      primaryBtn: {
        backgroundColor: theme.colors.primary.extraDeep,
        marginTop: theme.spacing.md,
      },

      ghostBtn: {
        marginTop: theme.spacing.md,
      },

      cancelBtn: {
        backgroundColor: theme.colors.dangerBg,
        marginTop: theme.spacing.md,
        borderColor: theme.colors.danger,
        borderWidth: 1,
      },
    })
  );

  const header = (
    <View style={styles.upperRow}>
      <Pressable style={styles.upperRowItem} onPress={handleGoBack}>
        <IconSymbol
          name="chevron.left"
          color={appTheme.colors.textMuted}
          size={16}
        />
        <ThemedText style={styles.upperRowItemText}>Back</ThemedText>
      </Pressable>
      <ThemedText style={styles.upperRowText}>My Appointment</ThemedText>
    </View>
  );

  if (loading || error || !appt) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        {header}
        <View style={styles.center}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color={appTheme.colors.primary.extraDeep}
            />
          ) : (
            <>
              <Text style={styles.errorText}>
                {error ?? 'Appointment not found'}
              </Text>
              <Button
                label="Try again"
                variant="outline"
                onPress={() => {
                  setLoading(true);
                  loadData();
                }}
              />
            </>
          )}
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
        {header}
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleReload} />
          }
        >
          {/* Banner */}
          {banner && (
            <View
              style={[
                styles.banner,
                {
                  borderColor: banner.borderColor,
                  backgroundColor: banner.bgColor,
                },
              ]}
            >
              <IconSymbol name={banner.icon} size={24} color={banner.color} />
              <Text style={[styles.bannerText, { color: banner.color }]}>
                {banner.message}
              </Text>
            </View>
          )}

          {/* Doctor card */}
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
                    <IconSymbol
                      name="person.fill"
                      size={52}
                      color={appTheme.colors.primary.mid}
                    />
                  </View>
                )}
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.doctorName}>{doctorName}</Text>
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
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/appointments/doctor/[id]',
                      params: { id: appt.provider_id },
                    })
                  }
                >
                  <Text style={styles.viewProfile}>View profile</Text>
                </TouchableOpacity>
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
                  name="calendar"
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
                  {(appt.sessions ?? 1) * (doctor?.sessionLength ?? 0)} minutes
                </Text>
              </View>
            </View>
            {isPaid && (
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
                    {truncate(appt.join_link || '', 30)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleJoinMeeting}
                  disabled={!appt.meeting_id}
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

          {/* Uploaded Files */}
          <View style={styles.card}>
            <View>
              <Text style={styles.sectionTitle}>Uploaded Files</Text>
              <Text style={styles.sectionSubtitle}>
                Here are the files you have uploaded for your appointment.
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
                Here are the cost/payment details for your appointment.
              </Text>
            </View>
            <View style={styles.paymentInfoCard}>
              <View style={styles.paymentInfoRow}>
                <Text style={styles.paymentInfoLabel}>Consultation fee</Text>
                <Text style={styles.paymentInfoValue}>
                  ₦{appt.sessionCost || '0.00'}
                </Text>
              </View>
              <View style={styles.paymentInfoRow}>
                <Text style={styles.paymentInfoLabel}>Sessions</Text>
                <Text style={styles.paymentInfoValue}>
                  {appt.sessions || 1}
                </Text>
              </View>
              <View style={styles.paymentInfoTotalRow}>
                <Text style={styles.paymentInfoTotalLabel}>Total</Text>
                <Text style={styles.paymentInfoTotalValue}>
                  ₦{((appt.sessionCost || 0) * (appt.sessions || 1)).toFixed(2)}
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
                    {appt.paymentStatus?.split('_').join(' ') || 'Unpaid'}
                  </Text>
                </View>
              </View>
            </View>

            {status === 'confirmed' && !isPaid && paymentLink && (
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
                <View style={styles.paymentBtnRow}>
                  <TouchableOpacity
                    style={styles.verifyPaymentBtn}
                    onPress={handleVerifyPayment}
                    disabled={verifying}
                    activeOpacity={0.8}
                  >
                    {verifying ? (
                      <ActivityIndicator
                        size="small"
                        color={appTheme.colors.mono.light}
                      />
                    ) : (
                      <Text style={styles.verifyPaymentBtnText}>
                        Verify Payment
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.payNowBtn}
                    onPress={handleCompletePayment}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.payNowBtnText}>Complete Payment</Text>
                    <IconSymbol
                      name="arrow.up.right"
                      size={14}
                      color={appTheme.colors.mono.light}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Buttons */}
          {status === 'confirmed' && isPaid && (
            <Button
              label="Join Meeting"
              onPress={handleJoinMeeting}
              disabled={!appt.meeting_id}
              style={styles.primaryBtn}
            />
          )}
          {isActive && (
            <>
              <Button
                label="Reschedule Appointment"
                variant={isPaid ? 'outline' : 'primary'}
                onPress={handleReschedule}
                disabled={!appt.provider_id}
                style={
                  isPaid
                    ? { marginTop: appTheme.spacing.md }
                    : styles.primaryBtn
                }
              />
              <Button
                label="Cancel Appointment"
                variant="ghost"
                onPress={handleCancel}
                loading={cancelling}
                style={styles.cancelBtn}
                textStyle={{ color: appTheme.colors.danger }}
              />
            </>
          )}
          {!isActive && (
            <Button
              label="Book Again"
              onPress={handleReschedule}
              disabled={!appt.provider_id}
              style={styles.primaryBtn}
            />
          )}
          {status === 'completed' && (
            <Button
              label="Review Doctor"
              variant="outline"
              onPress={handleReview}
              disabled={!appt.provider_id}
              style={styles.ghostBtn}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BookingDetailsScreen;
