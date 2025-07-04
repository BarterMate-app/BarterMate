// File: App.tsx

// Define global if missing to avoid Hermes errors (TypeScript-safe)
if (typeof global === 'undefined') {
  (global as any) = globalThis;
}

import React, { useEffect, useRef } from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme, AppState, Alert } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';

import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotificationsAsync } from './src/services/pushNotificationsService';
import { supabase } from './src/supabase';
import { navigationRef } from './src/navigation/RootNavigation';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // Display foreground notifications
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const scheme = useColorScheme();

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    async function setupNotifications() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.log('No user logged in, skipping push token registration.');
          return;
        }

        const token = await registerForPushNotificationsAsync();
        if (!token) {
          console.log('Push notification token not obtained.');
          return;
        }

        console.log('Expo Push Token:', token);

        const { error } = await supabase
          .from('users')
          .update({ expo_push_token: token })
          .eq('id', user.id);

        if (error) {
          console.error('Failed to save push token to user:', error);
          Alert.alert('Error', 'Could not save push token.');
        } else {
          console.log('Push token saved successfully.');
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
        Alert.alert('Error', 'Push notification setup failed.');
      }
    }

    setupNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received (foreground):', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);

      const screenRaw = response.notification.request.content.data?.screen as string | undefined;
      const params = response.notification.request.content.data?.params as Record<string, unknown> | undefined;

      if (screenRaw) {
        // Normalize screen names to exactly match your navigator
        const screenMap: Record<string, string> = {
          notifications: 'Notifications',
          home: 'Home',
          listings: 'Listings',
          listingdetails: 'ListingDetails',
          newlisting: 'NewListing',
          mapmodal: 'MapModal',
          createoffer: 'CreateOffer',
          offers: 'Offers',
          offerdetails: 'OfferDetails',
          messages: 'Messages',
          userprofile: 'UserProfile',
          editprofile: 'EditProfile',
          motivationfeed: 'MotivationFeed',
          tradehistory: 'TradeHistory',
          login: 'Login',
          register: 'Register',
          premiumbenefits: 'PremiumBenefits',
          // Add other screens as needed
        };

        const screenKey = screenRaw.toLowerCase();
        const targetScreen = screenMap[screenKey] || screenRaw;

        navigationRef.current?.navigate(targetScreen, params);
      }
    });

    // Reset badge count when app becomes active
    const appStateListener = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        await Notifications.setBadgeCountAsync(0);
      }
    });

    // Cleanup subscriptions on unmount
    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
      appStateListener.remove();
    };
  }, []);

  return (
    <PaperProvider>
      <NavigationContainer ref={navigationRef} theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}
