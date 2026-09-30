import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { colors, typography, spacing, radius } from '../../theme';

const notifications = [
  {
    id: '1',
    icon: '📅',
    title: 'Appointment Confirmed',
    message: 'Your appointment with Dr. Ajayi on 26 Feb at 10:00 AM has been confirmed.',
    time: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    icon: '🧪',
    title: 'Lab Results Ready',
    message: 'Your Complete Blood Count (CBC) results are now available.',
    time: '5 hours ago',
    read: false,
  },
  {
    id: '3',
    icon: '💊',
    title: 'Prescription Reminder',
    message: 'Remember to take your Lisinopril 10mg today.',
    time: '1 day ago',
    read: true,
  },
  {
    id: '4',
    icon: '👨‍⚕️',
    title: 'Doctor Message',
    message: 'Dr. Smith has sent you a message regarding your last consultation.',
    time: '2 days ago',
    read: true,
  },
  {
    id: '5',
    icon: '📋',
    title: 'Medical Record Updated',
    message: 'Your medical history has been updated with the latest consultation notes.',
    time: '3 days ago',
    read: true,
  },
  {
    id: '6',
    icon: '⭐',
    title: 'Rate Your Experience',
    message: 'How was your consultation with Dr. Nwosu? Please leave a review.',
    time: '4 days ago',
    read: true,
  },
];

export const NotificationsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header title="Notifications" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {notifications.map((notif) => (
          <TouchableOpacity
            key={notif.id}
            style={[styles.card, !notif.read && styles.cardUnread]}
            activeOpacity={0.85}
          >
            <View style={styles.iconBox}>
              <Text style={styles.icon}>{notif.icon}</Text>
            </View>
            <View style={styles.content}>
              <View style={styles.topRow}>
                <Text style={styles.title}>{notif.title}</Text>
                {!notif.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.message} numberOfLines={2}>{notif.message}</Text>
              <Text style={styles.time}>{notif.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.base, paddingBottom: 40, gap: spacing.sm },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  cardUnread: {
    backgroundColor: colors.primary[50],
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[800],
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  content: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[800],
    marginLeft: spacing.sm,
  },
  message: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  time: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
});
