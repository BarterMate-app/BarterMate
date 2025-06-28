import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ListingsScreen from '../screens/ListingsScreen';
import NewListingScreen from '../screens/NewListingScreen';
import OffersScreen from '../screens/OffersScreen';
import MessagesScreen from '../screens/MessagesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TradeHistoryScreen from '../screens/TradeHistoryScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Listings: undefined;
  NewListing: undefined;
  Offers: undefined;
  Messages: undefined;
  Settings: undefined;
  TradeHistory: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => (
  <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Listings" component={ListingsScreen} />
    <Stack.Screen name="NewListing" component={NewListingScreen} />
    <Stack.Screen name="Offers" component={OffersScreen} />
    <Stack.Screen name="Messages" component={MessagesScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="TradeHistory" component={TradeHistoryScreen} />
  </Stack.Navigator>
);

export default AppNavigator;
