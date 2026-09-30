// import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// import { useThemedStyles } from '@/hooks/useThemedStyle';

// // TODO: replace with notifications from the API once an endpoint exists
// const notifications = [
//   {
//     id: '1',
//     icon: '📅',
//     title: 'Appointment Confirmed',
//     message:
//       'Your appointment with Dr. Ajayi on 26 Feb at 10:00 AM has been confirmed.',
//     time: '2 hours ago',
//     read: false,
//   },
//   {
//     id: '2',
//     icon: '🧪',
//     title: 'Lab Results Ready',
//     message: 'Your Complete Blood Count (CBC) results are now available.',
//     time: '5 hours ago',
//     read: false,
//   },
//   {
//     id: '3',
//     icon: '💊',
//     title: 'Prescription Reminder',
//     message: 'Remember to take your Lisinopril 10mg today.',
//     time: '1 day ago',
//     read: true,
//   },
//   {
//     id: '4',
//     icon: '👨‍⚕️',
//     title: 'Doctor Message',
//     message:
//       'Dr. Smith has sent you a message regarding your last consultation.',
//     time: '2 days ago',
//     read: true,
//   },
//   {
//     id: '5',
//     icon: '📋',
//     title: 'Medical Record Updated',
//     message:
//       'Your medical history has been updated with the latest consultation notes.',
//     time: '3 days ago',
//     read: true,
//   },
//   {
//     id: '6',
//     icon: '⭐',
//     title: 'Rate Your Experience',
//     message:
//       'How was your consultation with Dr. Nwosu? Please leave a review.',
//     time: '4 days ago',
//     read: true,
//   },
// ];

// export default function NotificationsScreen() {
//   const styles = useThemedStyles((theme) =>
//     StyleSheet.create({
//       container: { flex: 1, backgroundColor: theme.colors.background },
//       scroll: {
//         padding: theme.spacing.base,
//         paddingBottom: 100,
//         gap: theme.spacing.sm,
//       },
//       card: {
//         flexDirection: 'row',
//         gap: theme.spacing.md,
//         backgroundColor: theme.colors.surfaceCard,
//         borderRadius: theme.radius.lg,
//         padding: theme.spacing.base,
//       },
//       cardUnread: {
//         backgroundColor: theme.colors.primary.shallow,
//         borderLeftWidth: 3,
//         borderLeftColor: theme.colors.primary.mid,
//       },
//       iconBox: {
//         width: 44,
//         height: 44,
//         borderRadius: 22,
//         backgroundColor: theme.colors.primary.base,
//         alignItems: 'center',
//         justifyContent: 'center',
//       },
//       icon: { fontSize: 20 },
//       content: { flex: 1 },
//       topRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 2,
//       },
//       title: {
//         fontSize: theme.typography.sizes.md,
//         fontWeight: '500',
//         color: theme.colors.text,
//         flex: 1,
//       },
//       unreadDot: {
//         width: 8,
//         height: 8,
//         borderRadius: 4,
//         backgroundColor: theme.colors.primary.mid,
//         marginLeft: theme.spacing.sm,
//       },
//       message: {
//         fontSize: theme.typography.sizes.sm,
//         color: theme.colors.textSecondary,
//         lineHeight: 20,
//         marginBottom: theme.spacing.xs,
//       },
//       time: {
//         fontSize: theme.typography.sizes.xs,
//         color: theme.colors.textMuted,
//       },
//     })
//   );

//   return (
//     <View style={styles.container}>
//       <ScrollView
//         contentContainerStyle={styles.scroll}
//         showsVerticalScrollIndicator={false}
//       >
//         {notifications.map((notif) => (
//           <TouchableOpacity
//             key={notif.id}
//             style={[styles.card, !notif.read && styles.cardUnread]}
//             activeOpacity={0.85}
//           >
//             <View style={styles.iconBox}>
//               <Text style={styles.icon}>{notif.icon}</Text>
//             </View>
//             <View style={styles.content}>
//               <View style={styles.topRow}>
//                 <Text style={styles.title}>{notif.title}</Text>
//                 {!notif.read && <View style={styles.unreadDot} />}
//               </View>
//               <Text style={styles.message} numberOfLines={2}>
//                 {notif.message}
//               </Text>
//               <Text style={styles.time}>{notif.time}</Text>
//             </View>
//           </TouchableOpacity>
//         ))}
//       </ScrollView>
//     </View>
//   );
// }

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/ui/AppHeader';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  apiGetNotifications,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
  NotificationData,
  NotificationType,
} from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';
import { formatDate } from '@/utils/formatter';
import { handleNotificationNavigation } from '@/utils/notificationNavigation';

const PAGE_SIZE = 20;

const NOTIFICATION_ICONS: Record<NotificationType, IconSymbolName> = {
  [NotificationType.APPOINTMENT]: 'calendar.badge',
  [NotificationType.REQUISITION]: 'flask.fill',
  [NotificationType.PRESCRIPTION]: 'pill.fill',
  [NotificationType.PAYMENT]: 'creditcard.fill',
  [NotificationType.SYSTEM]: 'gearshape.fill',
  [NotificationType.OTHER]: 'bell.fill',
};

const timeAgo = (isoString: string) => {
  const diffMs = Date.now() - new Date(isoString).getTime();
  if (Number.isNaN(diffMs)) return '';

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  return formatDate(isoString, true);
};

const useFetchNotifications = () => {
  const { token } = useAuth();

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // Prevent multiple onEndReached calls from fetching
  // the same page simultaneously.
  const loadingMoreRef = useRef(false);

  const fetchPage = useCallback(
    async (pageNum: number, isRefresh = false) => {
      if (!token) return;

      if (pageNum > 1 && loadingMoreRef.current) return;

      if (pageNum > 1) {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await apiGetNotifications(
          { page: pageNum, limit: PAGE_SIZE },
          token
        );
        const items = Array.isArray(res.data) ? res.data : [];

        setTotalPages(res.meta?.total_pages ?? 1);
        setNotifications((prev) =>
          pageNum === 1 ? items : [...prev, ...items]
        );
        setPage(pageNum);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        if (pageNum > 1) {
          setLoadingMore(false);
          loadingMoreRef.current = false;
        } else {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [token]
  );

  useEffect(() => {
    if (!token) return;

    const timeoutId = setTimeout(() => {
      void fetchPage(1);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [token, fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || loadingMore || page >= totalPages) return;

    fetchPage(page + 1);
  }, [fetchPage, loadingMore, page, totalPages]);

  const markRead = useCallback(
    async (id: string) => {
      if (!token) return;

      // Optimistic update; revert if the request fails.
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );

      try {
        await apiMarkNotificationRead(id, token);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
        );
      }
    },
    [token]
  );

  const markAllRead = useCallback(async () => {
    if (!token) return;

    setMarkingAll(true);
    try {
      await apiMarkAllNotificationsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setMarkingAll(false);
    }
  }, [token]);

  return {
    notifications,
    loading: token ? loading : false,
    refreshing,
    loadingMore,
    markingAll,
    hasUnread: notifications.some((n) => !n.is_read),
    loadMore,
    refresh: () => fetchPage(1, true),
    markRead,
    markAllRead,
  };
};

export default function NotificationsScreen() {
  const { theme: appTheme } = useTheme();
  const {
    notifications,
    loading,
    refreshing,
    loadingMore,
    markingAll,
    hasUnread,
    loadMore,
    refresh,
    markRead,
    markAllRead,
  } = useFetchNotifications();

  const handlePress = (notif: NotificationData) => {
    if (!notif.is_read) void markRead(notif.id);
    handleNotificationNavigation({
      type: notif.type,
      source_id: notif.source_id,
    });
  };

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      appHeader: { paddingHorizontal: theme.spacing.base, marginBottom: 0 },
      toolbar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: theme.spacing.base,
        paddingTop: theme.spacing.sm,
      },
      markAllButton: {
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm,
      },
      markAllText: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '500',
        color: theme.colors.primary.extraDeep,
      },
      markAllTextDisabled: { color: theme.colors.textMuted },
      scroll: {
        padding: theme.spacing.base,
        paddingBottom: 100,
        gap: theme.spacing.sm,
      },
      card: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.base,
      },
      cardUnread: {
        backgroundColor: theme.colors.primary.shallow,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary.mid,
      },
      iconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary.base,
        alignItems: 'center',
        justifyContent: 'center',
      },
      content: { flex: 1 },
      topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
      },
      title: {
        fontSize: theme.typography.sizes.md,
        fontWeight: '500',
        color: theme.colors.text,
        flex: 1,
      },
      unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary.mid,
        marginLeft: theme.spacing.sm,
      },
      message: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
        lineHeight: 20,
        marginBottom: theme.spacing.xs,
      },
      time: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textMuted,
      },
      loader: { marginTop: theme.spacing.xl },
      emptyText: {
        textAlign: 'center',
        marginTop: theme.spacing.xl,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },
    })
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Notifications" style={styles.appHeader} />
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={markAllRead}
          disabled={!hasUnread || markingAll}
        >
          {markingAll ? (
            <ActivityIndicator
              size="small"
              color={appTheme.colors.primary.extraDeep}
            />
          ) : (
            <Text
              style={[
                styles.markAllText,
                !hasUnread && styles.markAllTextDisabled,
              ]}
            >
              Mark all as read
            </Text>
          )}
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          color={appTheme.colors.primary.extraDeep}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={appTheme.colors.primary.extraDeep}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={appTheme.colors.primary.extraDeep} />
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No notifications yet</Text>
          }
          renderItem={({ item: notif }) => (
            <TouchableOpacity
              style={[styles.card, !notif.is_read && styles.cardUnread]}
              activeOpacity={0.85}
              onPress={() => handlePress(notif)}
            >
              <View style={styles.iconBox}>
                <IconSymbol
                  name={
                    NOTIFICATION_ICONS[notif.type] ??
                    NOTIFICATION_ICONS[NotificationType.OTHER]
                  }
                  size={22}
                  color={appTheme.colors.primary.extraDeep}
                />
              </View>
              <View style={styles.content}>
                <View style={styles.topRow}>
                  <Text style={styles.title}>{notif.title}</Text>
                  {!notif.is_read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.message} numberOfLines={2}>
                  {notif.body}
                </Text>
                <Text style={styles.time}>
                  {timeAgo(notif.sent_at || notif.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
