// File: src/services/notificationsService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Register for Expo push notifications and return the push token.
 * Handles Android notification channel setup.
 * @returns Expo push token string, or null if permission denied or error occurs.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Check current permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notifications!');
      return null;
    }

    // Retrieve Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    console.log('Expo Push Token:', token);

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

