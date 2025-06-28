import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { Provider as PaperProvider } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import * as Notifications from 'expo-notifications';

export default function App() {
  const scheme = useColorScheme();

  React.useEffect(() => {
    const setupNotifications = async () => {
      await Notifications.requestPermissionsAsync();
    };
    setupNotifications();
  }, []);

  return (
    <PaperProvider>
      <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}
