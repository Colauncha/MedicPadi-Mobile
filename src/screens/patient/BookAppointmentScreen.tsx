import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PatientStackParamList } from '../../navigation/types';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { colors, typography, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import {
  apiBookAppointment,
  apiGetDoctorAppointments,
  apiGetProfileById,
  AppointmentData,
  BusinessHours,
  ProfileFields,
} from '../../services/api';

type RouteProps = RouteProp<PatientStackParamList, 'BookAppointment'>;

const WEEKDAY_KEYS: (keyof BusinessHours)[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const REASONS = ['Consultation', 'Follow-up', 'Lab Test', 'Emergency'];
const DEFAULT_SESSION_MINUTES = 60;

// ── Helpers ───────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function getMonthGrid(year: number, month: number): { date: Date; isCurrentMonth: boolean }[][] {
  const firstOfMonth = new Date(year, month, 1);
  // getDay(): 0=Sun … 6=Sat; we want Mon-first so offset = (getDay() + 6) % 7
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const cursor = new Date(firstOfMonth);
  cursor.setDate(cursor.getDate() - startOffset);

  const rows: { date: Date; isCurrentMonth: boolean }[][] = [];
  for (let row = 0; row < 6; row++) {
    const cells: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let col = 0; col < 7; col++) {
      cells.push({ date: new Date(cursor), isCurrentMonth: cursor.getMonth() === month });
      cursor.setDate(cursor.getDate() + 1);
    }
    rows.push(cells);
  }
  return rows;
}

function getDayHours(
  date: Date,
  businessHours: BusinessHours | undefined,
): { start: number; end: number } | null {
  if (!businessHours) return null;
  const day = WEEKDAY_KEYS[date.getDay()];
  const entry = businessHours[day] as { start: number | 'closed'; end: number | 'closed' } | undefined;
  if (!entry || entry.start === 'closed' || entry.end === 'closed') return null;
  return { start: entry.start as number, end: entry.end as number };
}

function generateTimeSlots(date: Date, businessHours: BusinessHours | undefined, sessionMinutes: number): Date[] {
  const hours = getDayHours(date, businessHours);
  if (!hours) return [];
  const slots: Date[] = [];
  const stepHours = sessionMinutes / 60;
  for (let t = hours.start; t + stepHours <= hours.end + 0.001; t += stepHours) {
    const slot = new Date(date);
    slot.setHours(Math.floor(t), Math.round((t % 1) * 60), 0, 0);
    slots.push(slot);
  }
  return slots;
}

function isSlotBusy(slotTime: Date, appointments: AppointmentData[], sessionMinutes: number): boolean {
  for (const appt of appointments) {
    const apptStart = new Date(appt.appointment_time);
    const apptEnd = new Date(apptStart.getTime() + (appt.sessions ?? 1) * sessionMinutes * 60_000);
    if (slotTime >= apptStart && slotTime < apptEnd) return true;
  }
  return false;
}

function formatSlotTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return m === 0 ? `${h} ${period}` : `${h}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatSlotRange(start: Date, sessionMinutes: number): string {
  const end = new Date(start.getTime() + sessionMinutes * 60_000);
  return `${formatSlotTime(start)} – ${formatSlotTime(end)}`;
}

function formatSummaryDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────

export const BookAppointmentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { providerId, doctorName } = route.params ?? {};
  const { token } = useAuth();

  const today = useMemo(() => startOfDay(new Date()), []);
  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState<ProfileFields | null>(null);
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);

  const sessionMinutes = doctorProfile?.sessionLength ?? DEFAULT_SESSION_MINUTES;

  // ── Fetch doctor profile + appointments on mount ──────────────────────────

  useEffect(() => {
    if (!providerId || !token) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    Promise.all([
      apiGetProfileById(providerId, 'consultant', token).catch(() => null),
      apiGetDoctorAppointments(providerId, token).catch(() => ({ data: [] })),
    ]).then(([profileData, apptData]) => {
      if (profileData) setDoctorProfile(profileData.profile ?? null);
      setAppointments(apptData?.data ?? []);
    }).finally(() => setProfileLoading(false));
  }, [providerId, token]);

  // ── Reset time when date changes ──────────────────────────────────────────

  useEffect(() => { setSelectedTime(null); }, [selectedDate]);

  // ── Calendar ──────────────────────────────────────────────────────────────

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    setSelectedDate(null);
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    setSelectedDate(null);
  }, []);

  const isDayAvailable = useCallback((date: Date): boolean => {
    if (startOfDay(date) < today) return false;
    return getDayHours(date, doctorProfile?.businessHours) !== null;
  }, [today, doctorProfile]);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  // ── Time slots ────────────────────────────────────────────────────────────

  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    return generateTimeSlots(selectedDate, doctorProfile?.businessHours, sessionMinutes);
  }, [selectedDate, doctorProfile, sessionMinutes]);

  // ── Book handler ──────────────────────────────────────────────────────────

  const handleBook = async () => {
    if (!providerId) { Alert.alert('No doctor selected'); return; }
    if (!selectedTime) { Alert.alert('Select a time', 'Please choose a time slot.'); return; }
    setLoading(true);
    try {
      if (!token) throw new Error('Not authenticated');
      await apiBookAppointment(
        {
          provider_id: providerId,
          appointment_time: selectedTime.toISOString(),
          description: [selectedReason, description].filter(Boolean).join(' – ') || undefined,
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

  // ── Render ────────────────────────────────────────────────────────────────

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="My Appointment" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary[950]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Appointment" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Choose a date */}
        <Text style={styles.sectionTitle}>Choose a date</Text>
        <Text style={styles.sectionSubtitle}>Select your appointment date.</Text>

        {/* Calendar card */}
        <View style={styles.calendarCard}>
          {/* Month navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={styles.navArrow}>
              <Ionicons name="chevron-back" size={20} color={colors.primary[950]} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel(year, month)}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navArrow}>
              <Ionicons name="chevron-forward" size={20} color={colors.primary[950]} />
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.dayHeaderRow}>
            {DAY_LABELS.map(d => (
              <Text key={d} style={styles.dayHeader}>{d}</Text>
            ))}
          </View>

          {/* Date grid */}
          {grid.map((row, ri) => (
            <View key={ri} style={styles.dateRow}>
              {row.map(({ date, isCurrentMonth }, ci) => {
                const available = isCurrentMonth && isDayAvailable(date);
                const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                const isToday = isSameDay(date, today);

                return (
                  <TouchableOpacity
                    key={ci}
                    style={styles.dateCell}
                    onPress={() => available && setSelectedDate(new Date(date))}
                    disabled={!available}
                    activeOpacity={available ? 0.7 : 1}
                  >
                    <View style={[
                      styles.dateBubble,
                      isSelected && styles.dateBubbleSelected,
                      !isSelected && isToday && styles.dateBubbleToday,
                    ]}>
                      <Text style={[
                        styles.dateNum,
                        !isCurrentMonth && styles.dateNumFaded,
                        !available && isCurrentMonth && styles.dateNumDisabled,
                        isSelected && styles.dateNumSelected,
                      ]}>
                        {date.getDate()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Select Time */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.base }]}>Select Time</Text>
        {doctorName && (
          <Text style={styles.sectionSubtitle}>
            {doctorName} · {sessionMinutes}min sessions
          </Text>
        )}

        {!selectedDate ? (
          <Text style={styles.placeholder}>Select a date to see available slots.</Text>
        ) : timeSlots.length === 0 ? (
          <Text style={styles.placeholder}>No available slots on this day.</Text>
        ) : (
          <View style={styles.slotGrid}>
            {timeSlots.map((slot, i) => {
              const busy = isSlotBusy(slot, appointments, sessionMinutes);
              const active = selectedTime ? isSameDay(slot, selectedTime) && slot.getTime() === selectedTime.getTime() : false;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.slot,
                    active && styles.slotActive,
                    busy && styles.slotBusy,
                  ]}
                  onPress={() => !busy && setSelectedTime(slot)}
                  disabled={busy}
                  activeOpacity={busy ? 1 : 0.7}
                >
                  <Text style={[
                    styles.slotText,
                    active && styles.slotTextActive,
                    busy && styles.slotTextBusy,
                  ]}>
                    {formatSlotTime(slot)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Date / Time summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary[950]} />
            <View style={styles.summaryTextGroup}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>
                {selectedDate ? formatSummaryDate(selectedDate) : '—'}
              </Text>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="time-outline" size={18} color={colors.primary[950]} />
            <View style={styles.summaryTextGroup}>
              <Text style={styles.summaryLabel}>Time</Text>
              <Text style={styles.summaryValue}>
                {selectedTime ? formatSlotRange(selectedTime, sessionMinutes) : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Reason for seeing doctor */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.base }]}>Reason for seeing doctor</Text>
        <Text style={styles.sectionSubtitle}>Select the reason for seeing the doctor</Text>

        <View style={styles.reasonRow}>
          {REASONS.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.reasonChip, selectedReason === r && styles.reasonChipActive]}
              onPress={() => setSelectedReason(prev => prev === r ? null : r)}
            >
              <Text style={[styles.reasonText, selectedReason === r && styles.reasonTextActive]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.descInput}
          placeholder="Enter a description…"
          placeholderTextColor={colors.text.light}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Button
          label="Book Now"
          onPress={handleBook}
          loading={loading}
          disabled={!providerId || !selectedTime}
          style={styles.bookBtn}
        />

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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

  // Calendar
  calendarCard: {
    backgroundColor: colors.cardLight,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navArrow: {
    padding: spacing.sm,
  },
  monthLabel: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dateCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  dateBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBubbleSelected: {
    backgroundColor: colors.primary[950],
  },
  dateBubbleToday: {
    borderWidth: 1.5,
    borderColor: colors.primary[950],
  },
  dateNum: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
  },
  dateNumFaded: { color: colors.border },
  dateNumDisabled: { color: colors.text.light },
  dateNumSelected: { color: colors.text.white, fontFamily: typography.fonts.medium },

  // Time slots
  placeholder: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginBottom: spacing.base,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  slot: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotActive: {
    backgroundColor: colors.primary[950],
    borderColor: colors.primary[950],
  },
  slotBusy: {
    backgroundColor: '#f0f0f0',
    borderColor: '#e0e0e0',
  },
  slotText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
  },
  slotTextActive: { color: colors.text.white },
  slotTextBusy: { color: '#c0c0c0' },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.base,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cardLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  summaryTextGroup: { flex: 1 },
  summaryLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.text.light,
  },
  summaryValue: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
  },

  // Reason
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
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

  descInput: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
    minHeight: 80,
    marginBottom: spacing.base,
  },

  bookBtn: { marginTop: spacing.sm },
});
