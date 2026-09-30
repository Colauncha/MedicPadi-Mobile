import { NotificationType } from '@/services/api';
import { router } from 'expo-router';

export function handleNotificationNavigation(data: Record<string, unknown>) {
  if (!data) return;
  switch (data.type) {
    case NotificationType.APPOINTMENT:
      if (typeof data.source_id === 'string') {
        router.push({
          pathname: '/appointments/[id]',
          params: {
            id: data.source_id,
          },
        });
      }
      break;

    case NotificationType.SYSTEM:
      if (typeof data.source_id === 'string') {
        router.push({
          pathname: '/profile',
          params: {
            id: data.source_id,
          },
        });
      }
      break;

    case NotificationType.OTHER:
      if (typeof data.source_id === 'string') {
        router.push({
          pathname: '/notifications',
          params: {
            id: data.source_id,
          },
        });
      }
      break;

    // case NotificationType.PAYMENT:
    //   if (typeof data.source_id === 'string') {
    //     router.push({
    //       pathname: '/profile/wallet',
    //       params: {
    //         id: data.source_id,
    //       },
    //     });
    //   }
    //   break;

    default:
      break;
  }
}
