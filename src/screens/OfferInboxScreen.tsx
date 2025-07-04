// File: src/screens/OfferInboxScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../supabase';
import { useUser } from '../utils/useUser';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

import { acceptOffer } from '../services/tradeService';
import AppText from '../components/AppText';
import { colors, spacing, typography } from '../theme';;

type OfferInboxScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OfferInbox'
>;

interface OfferItem {
  id: string;
  listing_id: string;
  message: string | null;
  status: string;
  created_at: string;
  proposer_id: string;
  listings?: {
    id: string;
    title: string;
  };
  proposer?: {
    id: string;
    username: string;
  };
}

export default function OfferInboxScreen() {
  const user = useUser();
  const navigation = useNavigation<OfferInboxScreenNavigationProp>();

  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingIds, setActionLoadingIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchOffers();
  }, [user]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          id,
          listing_id,
          message,
          status,
          created_at,
          proposer_id,
          listings (
            id,
            title
          ),
          proposer:users!offers_proposer_id_fkey (
            id,
            username
          )
        `)
        .eq('recipient_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOffers(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load offers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateOfferStatus = async (offerId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: newStatus })
        .eq('id', offerId);

      if (error) throw error;

      setOffers((prev) =>
        prev.map((offer) =>
          offer.id === offerId ? { ...offer, status: newStatus } : offer
        )
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update offer status');
      console.error(error);
    }
  };

  const handleAccept = async (offer: OfferItem) => {
    if (actionLoadingIds.includes(offer.id)) return; // prevent double tap
    setActionLoadingIds((ids) => [...ids, offer.id]);
    try {
      await acceptOffer(offer.id);
      setOffers((prev) =>
        prev.map((o) =>
          o.id === offer.id ? { ...o, status: 'accepted' } : o
        )
      );
      Alert.alert('Success', 'Offer accepted and trade recorded.');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept offer. Try again later.');
      console.error(error);
    } finally {
      setActionLoadingIds((ids) => ids.filter((id) => id !== offer.id));
    }
  };

  const handleDecline = async (offer: OfferItem) => {
    if (actionLoadingIds.includes(offer.id)) return;
    setActionLoadingIds((ids) => [...ids, offer.id]);
    try {
      await updateOfferStatus(offer.id, 'declined');
      Alert.alert('Offer declined');
    } catch {
      // error handled in updateOfferStatus
    } finally {
      setActionLoadingIds((ids) => ids.filter((id) => id !== offer.id));
    }
  };

  const renderOfferItem = ({ item }: { item: OfferItem }) => {
    const loading = actionLoadingIds.includes(item.id);
    return (
      <View style={styles.offerContainer}>
        <AppText style={styles.listingTitle}>
          {item.listings?.title || 'Listing'}
        </AppText>
        <AppText style={styles.proposerName}>
          From: {item.proposer?.username || 'User'}
        </AppText>
        <AppText style={styles.message}>{item.message || '[No message]'}</AppText>
        <AppText style={styles.status}>Status: {item.status}</AppText>
        <AppText style={styles.date}>
          {new Date(item.created_at).toLocaleDateString()}{' '}
          {new Date(item.created_at).toLocaleTimeString()}
        </AppText>

        {item.status === 'pending' && (
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.acceptButton,
                loading && { opacity: 0.6 },
              ]}
              onPress={() => handleAccept(item)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <AppText style={styles.buttonText}>Accept</AppText>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.declineButton,
                loading && { opacity: 0.6 },
              ]}
              onPress={() => handleDecline(item)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <AppText style={styles.buttonText}>Decline</AppText>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <AppText>Please log in to view offers.</AppText>
      </View>
    );
  }

  if (offers.length === 0) {
    return (
      <View style={styles.center}>
        <AppText>No offers received yet.</AppText>
      </View>
    );
  }

  return (
    <FlatList
      data={offers}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={renderOfferItem}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  offerContainer: {
    backgroundColor: colors.background,
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  listingTitle: {
    fontWeight: '700',
    fontSize: 16,
  },
  proposerName: {
    fontStyle: 'italic',
    color: '#555',
    marginVertical: 4,
  },
  message: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  status: {
    fontWeight: '600',
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
