import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { PatientStackParamList } from '../../navigation/types';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { colors, typography, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { apiBookAppointment } from '../../services/api';

type RouteProps = RouteProp<PatientStackParamList, 'BookAppointment'>;

const TIME_SLOTS_AM = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM'];
const TIME_SLOTS_PM = ['1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
const REASONS = ['Consultation', 'Follow-up', 'Lab Test', 'Emergency'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const buildAppointmentTime = (dayIndex: number, time: string): string => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysMap: Record<number, number> = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 0 };
  const targetDow = daysMap[dayIndex];
  const diff = (targetDow - dayOfWeek + 7) % 7 || 7;
  const target = new Date(now);
  target.setDate(now.getDate() + diff);
  const [timePart, period] = time.split(' ');
  const [h, m] = timePart.split(':').map(Number);
  let hours = h;
  if (period === 'PM' && h !== 12) hours += 12;
  if (period === 'AM' && h === 12) hours = 0;
  target.setHours(hours, m, 0, 0);
  return target.toISOString();
};

export const BookAppointmentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { providerId, doctorName } = route.params ?? {};
  const { token } = useAuth();
  const now = new Date();
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const weekDates = DAYS.map((_, i) => {
    const d = new Date(now);
    const dayOfWeek = now.getDay();
    const daysMap: Record<number, number> = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 0 };
    const targetDow = daysMap[i];
    const diff = (targetDow - dayOfWeek + 7) % 7 || 7;
    d.setDate(now.getDate() + diff);
    return d.getDate();
  });

  const handleBook = async () => {
    setLoading(true);
    if (!providerId) {
      Alert.alert('No doctor selected', 'Please select a doctor before booking.');
      setLoading(false);
      return;
    }
    if (!selectedTime) {
      Alert.alert('Select a time', 'Please choose an appointment time slot.');
      setLoading(false);
      return;
    }
    try {
      if (!token) throw new Error('Not authenticated');
      await apiBookAppointment(
        {
          provider_id: providerId,
          appointment_time: buildAppointmentTime(selectedDay, selectedTime),
          description: selectedReason ?? undefined,
          sessions: 1,
        },
        token,
      );
      Alert.alert('Appointment booked!', 'Your appointment has been confirmed.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Booking failed', e.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Book Appointment" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {doctorName && (
          <View style={styles.doctorBanner}>
            <Text style={styles.doctorBannerText}>Booking with {doctorName}</Text>
          </View>
        )}
        {!providerId && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              No doctor selected. Please choose a doctor from the dashboard to book.
            </Text>
          </View>
        )}
        <View style={styles.calendar}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthText}>
              {now.toLocaleString('en-GB', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.daysRow}>
            {DAYS.map((day, idx) => (
              <TouchableOpacity
                key={day}
                style={styles.dayCol}
                onPress={() => setSelectedDay(idx)}
              >
                <Text style={styles.dayLabel}>{day}</Text>
                <View style={[styles.dateCircle, selectedDay === idx && styles.dateCircleActive]}>
                  <Text style={[styles.dateNum, selectedDay === idx && styles.dateNumActive]}>
                    {weekDates[idx]}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeGrid}>
            {[...TIME_SLOTS_AM, ...TIME_SLOTS_PM].map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[styles.timeSlot, selectedTime === slot && styles.timeSlotActive]}
                onPress={() => setSelectedTime(slot)}
              >
                <Text style={[styles.timeSlotText, selectedTime === slot && styles.timeSlotTextActive]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason for visit</Text>
          <View style={styles.reasonRow}>
            {REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonChip, selectedReason === reason && styles.reasonChipActive]}
                onPress={() => setSelectedReason(reason)}
              >
                <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextActive]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <Button
          label="Book Now"
          onPress={handleBook}
          loading={loading}
          disabled={!providerId}
          style={styles.bookBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.base, paddingBottom: 40 },
  doctorBanner: {
    backgroundColor: colors.cardBlue,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  doctorBannerText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.primary[950],
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#ffedc6',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  warningText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: '#6b4f00',
    lineHeight: 20,
  },
  calendar: {
    backgroundColor: colors.cardLight,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  calendarHeader: {
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  monthText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
  },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  dayLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleActive: { backgroundColor: colors.primary[950] },
  dateNum: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
  },
  dateNumActive: { color: colors.text.white },
  section: { marginBottom: spacing.base },
  sectionTitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeSlot: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  timeSlotActive: { backgroundColor: colors.primary[950], borderColor: colors.primary[950] },
  timeSlotText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
  },
  timeSlotTextActive: { color: colors.text.white },
  reasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  reasonChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.cardBlue,
  },
  reasonChipActive: { backgroundColor: colors.primary[950] },
  reasonText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
  },
  reasonTextActive: { color: colors.text.white },
  bookBtn: { marginTop: spacing.base },
});
