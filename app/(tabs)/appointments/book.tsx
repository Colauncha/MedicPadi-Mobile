import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  apiBookAppointment,
  apiGetDoctorAppointments,
  apiGetProfileById,
  AppointmentData,
  BusinessHours,
  ProfileFields,
} from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';

const WEEKDAY_KEYS: (keyof BusinessHours)[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
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

function getMonthGrid(
  year: number,
  month: number
): { date: Date; isCurrentMonth: boolean }[][] {
  const firstOfMonth = new Date(year, month, 1);
  // getDay(): 0=Sun … 6=Sat; we want Mon-first so offset = (getDay() + 6) % 7
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const cursor = new Date(firstOfMonth);
  cursor.setDate(cursor.getDate() - startOffset);

  const rows: { date: Date; isCurrentMonth: boolean }[][] = [];
  for (let row = 0; row < 6; row++) {
    const cells: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let col = 0; col < 7; col++) {
      cells.push({
        date: new Date(cursor),
        isCurrentMonth: cursor.getMonth() === month,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    rows.push(cells);
  }
  return rows;
}

function getDayHours(
  date: Date,
  businessHours: BusinessHours | undefined
): { start: number; end: number } | null {
  if (!businessHours) return null;
  const day = WEEKDAY_KEYS[date.getDay()];
  const entry = businessHours[day] as
    | { start: number | 'closed'; end: number | 'closed' }
    | undefined;
  if (!entry || entry.start === 'closed' || entry.end === 'closed')
    return null;
  return { start: entry.start, end: entry.end };
}

function generateTimeSlots(
  date: Date,
  businessHours: BusinessHours | undefined,
  sessionMinutes: number
): Date[] {
  const hours = getDayHours(date, businessHours);
  if (!hours) return [];
  const slots: Date[] = [];
  const stepHours = sessionMinutes / 60;
  for (
    let t = hours.start;
    t + stepHours <= hours.end + 0.001;
    t += stepHours
  ) {
    const slot = new Date(date);
    slot.setHours(Math.floor(t), Math.round((t % 1) * 60), 0, 0);
    slots.push(slot);
  }
  return slots;
}

function isSlotBusy(
  slotTime: Date,
  appointments: AppointmentData[],
  sessionMinutes: number
): boolean {
  for (const appt of appointments) {
    const apptStart = new Date(appt.appointment_time);
    const apptEnd = new Date(
      apptStart.getTime() + (appt.sessions ?? 1) * sessionMinutes * 60_000
    );
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
  return m === 0
    ? `${h} ${period}`
    : `${h}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatSlotRange(start: Date, sessionMinutes: number): string {
  const end = new Date(start.getTime() + sessionMinutes * 60_000);
  return `${formatSlotTime(start)} – ${formatSlotTime(end)}`;
}

function formatSummaryDate(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// ── Screen ────────────────────────────────────────────────────────────────────

export default function BookAppointmentScreen() {
  const { providerId, doctorName } = useLocalSearchParams<{
    providerId?: string;
    doctorName?: string;
  }>();
  const { token } = useAuth();
  const { theme: appTheme } = useTheme();

  const today = useMemo(() => startOfDay(new Date()), []);
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(
    !!providerId && !!token
  );
  const [doctorProfile, setDoctorProfile] = useState<ProfileFields | null>(
    null
  );
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);

  const sessionMinutes =
    doctorProfile?.sessionLength ?? DEFAULT_SESSION_MINUTES;

  // ── Fetch doctor profile + appointments ───────────────────────────────────

  useEffect(() => {
    if (!providerId || !token) return;
    Promise.all([
      apiGetProfileById(providerId, 'consultant', token).catch(() => null),
      apiGetDoctorAppointments(providerId, token).catch(() => ({
        data: [] as AppointmentData[],
      })),
    ])
      .then(([profileData, apptData]) => {
        if (profileData) setDoctorProfile(profileData.profile ?? null);
        setAppointments(apptData?.data ?? []);
      })
      .finally(() => setProfileLoading(false));
  }, [providerId, token]);

  // ── Calendar ──────────────────────────────────────────────────────────────

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  const selectDate = (date: Date | null) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const changeMonth = (delta: number) => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
    selectDate(null);
  };

  const isDayAvailable = useCallback(
    (date: Date): boolean => {
      if (startOfDay(date) < today) return false;
      return getDayHours(date, doctorProfile?.businessHours) !== null;
    },
    [today, doctorProfile]
  );

  // ── Time slots ────────────────────────────────────────────────────────────

  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    return generateTimeSlots(
      selectedDate,
      doctorProfile?.businessHours,
      sessionMinutes
    );
  }, [selectedDate, doctorProfile, sessionMinutes]);

  // ── Book handler ──────────────────────────────────────────────────────────

  const handleBook = async () => {
    if (!providerId) {
      Alert.alert('No doctor selected');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Select a time', 'Please choose a time slot.');
      return;
    }
    setLoading(true);
    try {
      if (!token) throw new Error('Not authenticated');
      await apiBookAppointment(
        {
          provider_id: providerId,
          appointment_time: selectedTime.toISOString(),
          description:
            [selectedReason, description].filter(Boolean).join(' – ') ||
            undefined,
          sessions: 1,
        },
        token
      );
      Alert.alert(
        'Appointment booked!',
        'Your appointment has been confirmed.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Booking failed', e.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
      scroll: { padding: theme.spacing.base, paddingBottom: 120 },

      sectionTitle: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 2,
      },
      sectionTitleSpaced: { marginTop: theme.spacing.base },
      sectionSubtitle: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
      },
      noDoctor: {
        backgroundColor: theme.colors.warningBg,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.base,
        gap: theme.spacing.xs,
      },
      noDoctorText: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.warning,
      },
      noDoctorLink: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '600',
        color: theme.colors.primary.mid,
      },

      // Calendar
      calendarCard: {
        backgroundColor: theme.colors.surfaceCardLight,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.base,
        marginBottom: theme.spacing.sm,
      },
      monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
      },
      navArrow: { padding: theme.spacing.sm },
      monthLabel: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '600',
        color: theme.colors.text,
      },
      dayHeaderRow: {
        flexDirection: 'row',
        marginBottom: theme.spacing.sm,
      },
      dayHeader: {
        flex: 1,
        textAlign: 'center',
        fontSize: theme.typography.sizes.sm,
        fontWeight: '500',
        color: theme.colors.textSecondary,
      },
      dateRow: { flexDirection: 'row', marginBottom: 4 },
      dateCell: { flex: 1, alignItems: 'center', paddingVertical: 2 },
      dateBubble: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
      },
      dateBubbleSelected: {
        backgroundColor: theme.colors.primary.extraDeep,
      },
      dateBubbleToday: {
        borderWidth: 1.5,
        borderColor: theme.colors.primary.extraDeep,
      },
      dateNum: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
      },
      dateNumFaded: { color: theme.colors.border },
      dateNumDisabled: { color: theme.colors.textMuted },
      dateNumSelected: {
        color: theme.colors.buttonText,
        fontWeight: '500',
      },

      // Time slots
      placeholder: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.base,
      },
      slotGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.base,
      },
      slot: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.base,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceCard,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      slotActive: {
        backgroundColor: theme.colors.primary.extraDeep,
        borderColor: theme.colors.primary.extraDeep,
      },
      slotBusy: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.surface,
      },
      slotText: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
      },
      slotTextActive: { color: theme.colors.buttonText },
      slotTextBusy: { color: theme.colors.textMuted },

      // Summary
      summaryRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.base,
      },
      summaryCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.surfaceCardLight,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
      },
      summaryTextGroup: { flex: 1 },
      summaryLabel: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textSecondary,
      },
      summaryValue: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '500',
        color: theme.colors.text,
      },

      // Reason
      reasonRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
      },
      reasonChip: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.primary.shallow,
      },
      reasonChipActive: { backgroundColor: theme.colors.primary.extraDeep },
      reasonText: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
      },
      reasonTextActive: { color: theme.colors.buttonText },

      descInput: {
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
        minHeight: 80,
        marginBottom: theme.spacing.base,
      },

      bookBtn: { marginTop: theme.spacing.sm },
    })
  );

  if (profileLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator
          size="large"
          color={appTheme.colors.primary.deep}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!providerId && (
          <View style={styles.noDoctor}>
            <Text style={styles.noDoctorText}>
              No doctor selected. Pick a doctor to see their availability.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/appointments/speciality')}
            >
              <Text style={styles.noDoctorLink}>Find a doctor →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Choose a date */}
        <Text style={styles.sectionTitle}>Choose a date</Text>
        <Text style={styles.sectionSubtitle}>Select your appointment date.</Text>

        <View style={styles.calendarCard}>
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={() => changeMonth(-1)}
              style={styles.navArrow}
            >
              <IconSymbol
                name="chevron.left"
                size={20}
                color={appTheme.colors.primary.extraDeep}
              />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel(year, month)}</Text>
            <TouchableOpacity
              onPress={() => changeMonth(1)}
              style={styles.navArrow}
            >
              <IconSymbol
                name="chevron.right"
                size={20}
                color={appTheme.colors.primary.extraDeep}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.dayHeaderRow}>
            {DAY_LABELS.map((d) => (
              <Text key={d} style={styles.dayHeader}>
                {d}
              </Text>
            ))}
          </View>

          {grid.map((row, ri) => (
            <View key={ri} style={styles.dateRow}>
              {row.map(({ date, isCurrentMonth }, ci) => {
                const available = isCurrentMonth && isDayAvailable(date);
                const isSelected = selectedDate
                  ? isSameDay(date, selectedDate)
                  : false;
                const isToday = isSameDay(date, today);

                return (
                  <TouchableOpacity
                    key={ci}
                    style={styles.dateCell}
                    onPress={() => available && selectDate(new Date(date))}
                    disabled={!available}
                    activeOpacity={available ? 0.7 : 1}
                  >
                    <View
                      style={[
                        styles.dateBubble,
                        isSelected && styles.dateBubbleSelected,
                        !isSelected && isToday && styles.dateBubbleToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dateNum,
                          !isCurrentMonth && styles.dateNumFaded,
                          !available &&
                            isCurrentMonth &&
                            styles.dateNumDisabled,
                          isSelected && styles.dateNumSelected,
                        ]}
                      >
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
        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
          Select Time
        </Text>
        {doctorName ? (
          <Text style={styles.sectionSubtitle}>
            {doctorName} · {sessionMinutes}min sessions
          </Text>
        ) : null}

        {!selectedDate ? (
          <Text style={styles.placeholder}>
            Select a date to see available slots.
          </Text>
        ) : timeSlots.length === 0 ? (
          <Text style={styles.placeholder}>No available slots on this day.</Text>
        ) : (
          <View style={styles.slotGrid}>
            {timeSlots.map((slot, i) => {
              const busy = isSlotBusy(slot, appointments, sessionMinutes);
              const active =
                selectedTime?.getTime() === slot.getTime();
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
                  <Text
                    style={[
                      styles.slotText,
                      active && styles.slotTextActive,
                      busy && styles.slotTextBusy,
                    ]}
                  >
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
            <IconSymbol
              name="calendar"
              size={18}
              color={appTheme.colors.primary.extraDeep}
            />
            <View style={styles.summaryTextGroup}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>
                {selectedDate ? formatSummaryDate(selectedDate) : '—'}
              </Text>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <IconSymbol
              name="clock"
              size={18}
              color={appTheme.colors.primary.extraDeep}
            />
            <View style={styles.summaryTextGroup}>
              <Text style={styles.summaryLabel}>Time</Text>
              <Text style={styles.summaryValue}>
                {selectedTime
                  ? formatSlotRange(selectedTime, sessionMinutes)
                  : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Reason for seeing doctor */}
        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
          Reason for seeing doctor
        </Text>
        <Text style={styles.sectionSubtitle}>
          Select the reason for seeing the doctor
        </Text>

        <View style={styles.reasonRow}>
          {REASONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.reasonChip,
                selectedReason === r && styles.reasonChipActive,
              ]}
              onPress={() =>
                setSelectedReason((prev) => (prev === r ? null : r))
              }
            >
              <Text
                style={[
                  styles.reasonText,
                  selectedReason === r && styles.reasonTextActive,
                ]}
              >
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.descInput}
          placeholder="Enter a description…"
          placeholderTextColor={appTheme.colors.textMuted}
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
  );
}
