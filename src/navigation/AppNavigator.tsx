// src/navigation/AppNavigator.tsx

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import your screens
import AuthGate from '../screens/AuthGate';  // import AuthGate
import HomeScreen from '../screens/HomeScreen';
import ListingsScreen from '../screens/ListingsScreen';
import ListingDetailsScreen from '../screens/ListingDetailsScreen';
import NewListingScreen from '../screens/NewListingScreen';
import MapModal from '../components/MapModal';
import CreateOfferScreen from '../screens/CreateOfferScreen';
import OffersScreen from '../screens/OffersScreen';
import OfferDetailsScreen from '../screens/OfferDetailsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import MotivationFeedScreen from '../screens/MotivationFeedScreen';
import TradeHistoryScreen from '../screens/TradeHistoryScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PremiumBenefitsScreen from '../screens/PremiumBenefitsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import KnowledgeThreadScreen from '../screens/KnowledgeThreadScreen';
import ConversationScreen from '../screens/ConversationScreen';

export type RootStackParamList = {
  AuthGate: undefined;   // add AuthGate type
  Home: undefined;
  Listings: undefined;
  ListingDetails: { listingId: string };
  NewListing: undefined;
  MapModal: {
    initialLocation: { lat: number; lon: number } | null;
    onLocationPicked: (location: { lat: number; lon: number }) => void;
  };
  CreateOffer: { listingId: string };
  Offers: undefined;
  OfferDetails: { offerId: string };
  Messages: undefined;
  UserProfile: { userId: string };
  EditProfile: undefined;
  MotivationFeed: undefined;
  TradeHistory: undefined;
  Login: undefined;
  Register: undefined;
  PremiumBenefits: undefined;
  Notifications: undefined;
  KnowledgeThread: { threadId: string };
  Conversation: {
    otherUserId: string;
    listingId?: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="AuthGate" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AuthGate" component={AuthGate} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Listings" component={ListingsScreen} />
      <Stack.Screen name="ListingDetails" component={ListingDetailsScreen} />
      <Stack.Screen name="NewListing" component={NewListingScreen} />
      <Stack.Screen name="MapModal" component={MapModal} />
      <Stack.Screen name="CreateOffer" component={CreateOfferScreen} />
      <Stack.Screen name="Offers" component={OffersScreen} />
      <Stack.Screen name="OfferDetails" component={OfferDetailsScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="MotivationFeed" component={MotivationFeedScreen} />
      <Stack.Screen name="TradeHistory" component={TradeHistoryScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PremiumBenefits" component={PremiumBenefitsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="KnowledgeThread" component={KnowledgeThreadScreen} />
      <Stack.Screen name="Conversation" component={ConversationScreen} />
    </Stack.Navigator>
  );
}
