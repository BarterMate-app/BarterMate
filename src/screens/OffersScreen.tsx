// File: src/screens/OfferInboxScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { supabase } from '../supabase';
import { useUser } from '../utils/useUser';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import ScreenWrapper from '../components/ScreenWrapper';
import AppText from '../components/AppText';

import { acceptTrade } from '../services/tradeService';

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
  offered_by?: string | null;
  recipient_id?: string | null;
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
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingIds, setActionLoadingIds] = useState<string[]>([]);

  const fetchOffers = useCallback(async () => {
    if (!user) return;
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
          offered_by,
          recipient_id,
          listings (
            id,
            title
          ),
          proposer:users!offers_proposer_id_fkey (
            id,
            username
          )
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOffers(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load offers');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOffers();
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
    if (actionLoadingIds.includes(offer.id)) return;
    setActionLoadingIds((ids) => [...ids, offer.id]);
    try {
      await acceptTrade({
        listingId: offer.listing_id,
        proposerId: offer.proposer_id,
        recipientId: user!.id,
        offerId: offer.id,
      });

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
      <View style={styles.offerContainer} key={item.id}>
        <AppText style={styles.listingTitle}>{item.listings?.title || 'Listing'}</AppText>
        <AppText style={styles.proposerName}>From: {item.proposer?.username || 'User'}</AppText>
        <AppText style={styles.message}>{item.message || '[No message]'}</AppText>
        <AppText
          style={[
            styles.status,
            item.status === 'accepted'
              ? styles.statusAccepted
              : item.status === 'declined'
              ? styles.statusDeclined
              : {},
          ]}
        >
          Status: {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </AppText>
        <AppText style={styles.date}>
          {new Date(item.created_at).toLocaleDateString()}{' '}
          {new Date(item.created_at).toLocaleTimeString()}
        </AppText>

        {item.status === 'pending' && (
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton, loading && styles.disabledButton]}
              onPress={() => handleAccept(item)}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <AppText style={styles.buttonText}>Accept</AppText>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.declineButton, loading && styles.disabledButton]}
              onPress={() => handleDecline(item)}
              disabled={loading}
              activeOpacity={0.7}
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

  if (loading && !refreshing) {
    return (
      <ScreenWrapper style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </ScreenWrapper>
    );
  }

  if (!user) {
    return (
      <ScreenWrapper style={styles.center}>
        <AppText>Please log in to view offers.</AppText>
      </ScreenWrapper>
    );
  }

  if (offers.length === 0) {
    return (
      <ScreenWrapper style={styles.center}>
        <AppText>No offers received yet.</AppText>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <FlatList
        data={offers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={renderOfferItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  listingTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: '#222',
  },
  proposerName: {
    fontStyle: 'italic',
    color: '#555',
    marginVertical: 6,
  },
  message: {
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
  },
  status: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#007AFF',
  },
  statusAccepted: {
    color: '#4CAF50',
  },
  statusDeclined: {
    color: '#F44336',
  },
  date: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 25,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#F44336',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
