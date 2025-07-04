// src/screens/OfferDetailsScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../supabase';

import ScreenWrapper from '../components/ScreenWrapper';
import AppText from '../components/AppText';
import AppButton from '../components/AppButton';

type OfferDetailsRouteProp = RouteProp<RootStackParamList, 'OfferDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'OfferDetails'>;

type Offer = {
  id: string;
  listing_id: string;
  message: string | null;
  status: string;
  created_at: string;
  proposer_id: string;
};

export default function OfferDetailsScreen() {
  const route = useRoute<OfferDetailsRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { offerId } = route.params;

  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOfferDetails();
  }, []);

  const fetchOfferDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (error) throw error;
      setOffer(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load offer details.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </ScreenWrapper>
    );
  }

  if (!offer) {
    return (
      <ScreenWrapper style={styles.center}>
        <AppText>Offer not found.</AppText>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <AppText style={styles.title}>Offer Details</AppText>
        <AppText>ID: {offer.id}</AppText>
        <AppText>Status: {offer.status}</AppText>
        <AppText>Message: {offer.message || '[No message]'}</AppText>
        <AppText>Created: {new Date(offer.created_at).toLocaleString()}</AppText>

        <AppButton title="Back" onPress={() => navigation.goBack()} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
});
