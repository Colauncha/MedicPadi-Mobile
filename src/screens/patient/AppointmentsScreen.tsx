import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../navigation/types';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { colors, typography, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import {
  AppointmentData,
  apiGetAppointments,
  apiCancelAppointment,
} from '../../services/api';

type Tab = 'upcoming' | 'past';

const STATUS_MAP: Record<string, string> = {
  confirmed: 'confirmed',
  pending: 'pending',
  completed: 'completed',
  cancelled: 'canceled',
  canceled: 'canceled',
  rejected: 'canceled',
};

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const doctorName = (appt: AppointmentData): string => {
  if (appt.provider?.firstName)
    return `Dr. ${appt.provider.firstName} ${appt.provider.lastName ?? ''}`.trim();
  return 'Doctor';
};

const doctorSpecialty = (appt: AppointmentData): string =>
  appt.provider?.speciality ?? 'General Practitioner';

type Nav = NativeStackNavigationProp<PatientStackParamList>;

export const AppointmentsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [upcoming, setUpcoming] = useState<AppointmentData[]>([]);
  const [past, setPast] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAppointments = useCallback(async () => {
    if (!token) return;
    try {
      const [upcomingRes, pastRes] = await Promise.allSettled([
        apiGetAppointments({ status: 'pending,confirmed', limit: 20 }, token),
        apiGetAppointments({ status: 'completed,cancelled,canceled', limit: 20 }, token),
      ]);
      if (upcomingRes.status === 'fulfilled') {
        setUpcoming(Array.isArray(upcomingRes.value.data) ? upcomingRes.value.data : []);
      }
      if (pastRes.status === 'fulfilled') {
        setPast(Array.isArray(pastRes.value.data) ? pastRes.value.data : []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleCancel = (id: string) => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
      { text: 'No' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          try {
            await apiCancelAppointment(id, token);
            setUpcoming((prev) => prev.filter((a) => a.id !== id));
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Could not cancel appointment.');
          }
        },
      },
    ]);
  };

  const data = activeTab === 'upcoming' ? upcoming : past;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
      </View>
      <View style={styles.tabs}>
        {(['upcoming', 'past'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary[950]} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAppointments(); }} />}
        >
          {data.length === 0 ? (
            <Text style={styles.emptyText}>
              No {activeTab} appointments
            </Text>
          ) : (
            data.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.docAvatar} />
                  <View style={styles.docInfo}>
                    <Text style={styles.docName}>{doctorName(item)}</Text>
                    <Text style={styles.docSpecialty}>{doctorSpecialty(item)}</Text>
                    <Text style={styles.docDate}>{formatDate(item.appointment_time)}</Text>
                  </View>
                  <StatusBadge status={(STATUS_MAP[item.status] ?? 'pending') as 'confirmed' | 'pending' | 'canceled' | 'completed'} />
                </View>
                {activeTab === 'upcoming' && (
                  <View style={styles.cardActions}>
                    <Button
                      label="Reschedule"
                      onPress={() =>
                        navigation.navigate('BookAppointment', {
                          providerId: item.provider_id,
                          doctorName: doctorName(item),
                        })
                      }
                      variant="outline"
                      size="sm"
                      style={{ flex: 1, marginRight: spacing.sm }}
                    />
                    <Button
                      label="Cancel"
                      onPress={() => handleCancel(item.id)}
                      variant="ghost"
                      size="sm"
                      textStyle={{ color: colors.danger }}
                      style={{ flex: 1 }}
                    />
                  </View>
                )}
              </View>
            ))
          )}
          <Button
            label="Book New Appointment"
            onPress={() => navigation.navigate('BookAppointment', {})}
            style={styles.bookBtn}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.lg,
    color: colors.text.dark,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  tabActive: { backgroundColor: colors.primary[950] },
  tabText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.text.medium,
  },
  tabTextActive: { color: colors.text.white },
  list: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.text.light,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  docAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.text.dark,
  },
  docInfo: { flex: 1 },
  docName: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
  },
  docSpecialty: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginBottom: 2,
  },
  docDate: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.text.light,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  bookBtn: { marginTop: spacing.base },
});
