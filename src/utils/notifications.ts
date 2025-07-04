// File: src/utils/notifications.ts

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from '../supabase';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  let token: string | null = null;

  if (!Device.isDevice) {
    alert('Must use physical device for Push Notifications');
    return null;
  }

  if (Platform.OS === 'android') {
    // Create Android notification channel (important for Android)
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for notifications!');
      return null;
    }

    const expoPushTokenData = await Notifications.getExpoPushTokenAsync();
    token = expoPushTokenData.data;

    console.log('Expo Push Token:', token);

    // Save token to Supabase
    const { error } = await supabase
      .from('user_push_tokens')
      .upsert({ user_id: userId, token });

    if (error) {
      console.error('Error saving push token:', error);
    }
  } catch (error) {
    console.error('Error during push token registration:', error);
  }

  return token;
}

