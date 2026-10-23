import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    throw new Error('Push notifications require a physical device');
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let status = existingStatus;

  if (existingStatus !== 'granted') {
    const permission = await Notifications.requestPermissionsAsync();
    status = permission.status;
  }

  if (status !== 'granted') {
    throw new Error('Push notification permission denied');
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error('EAS project ID is missing');
  }

  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId,
    })
  ).data;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  console.log('Push notification token:', token);

  return {
    token,
    device: Device.isDevice
      ? `${Device.brand} - ${Device.deviceName}`
      : 'Unknown device',
  };
}
