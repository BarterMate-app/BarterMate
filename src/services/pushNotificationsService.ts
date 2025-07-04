// File: src/services/pushNotificationsService.ts

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (!Device.isDevice) {
    Alert.alert('Push Notifications require a physical device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Failed to get push token permissions!');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  token = tokenData.data;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}
