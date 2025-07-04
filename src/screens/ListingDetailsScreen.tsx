import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '../supabase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUser } from '../utils/useUser';
import { colors } from '../theme';
import ScreenWrapper from '../components/ScreenWrapper';
import AppText from '../components/AppText';
import AppButton from '../components/AppButton';
import { sendPushNotification } from '../utils/PushNotificationClient';

type Listing = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  is_free: boolean;
  wanted_category: string;
  wanted_details: string;
  lat: number;
  lon: number;
  image_url: string | null;
  created_at: string;
};

export default function ListingDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const user = useUser();

  const { listingId } = route.params;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingHelpful, setSendingHelpful] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (error) {
        console.error(error);
        Alert.alert('Error', 'Could not fetch listing.');
        setLoading(false);
        return;
      }

      setListing(data);
      setLoading(false);
    };

    fetchListing();
  }, [listingId]);

  const startConversation = () => {
    if (!user) return Alert.alert('Please log in first.');
    if (listing?.user_id === user.id) return Alert.alert("It's your own listing.");
    navigation.navigate('Conversation', { otherUserId: listing!.user_id, listingId: listing!.id });
  };

  const handleMarkHelpful = async () => {
    if (!user) return Alert.alert('Please log in.');
    if (listing?.user_id === user.id) return Alert.alert("You can't mark your own listing.");
    setSendingHelpful(true);

    try {
      await supabase.from('helpful_marks').insert([{ listing_id: listing!.id, user_id: user.id }]);

      const { data: owner, error } = await supabase
        .from('profiles')
        .select('expo_push_token')
        .eq('id', listing!.user_id)
        .single();

      if (owner?.expo_push_token) {
        await sendPushNotification(owner.expo_push_token, 'Someone marked your trade as helpful!');
      }

      Alert.alert('Thank you!');
    } catch (e) {
      console.error(e);
      Alert.alert('Failed.');
    } finally {
      setSendingHelpful(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <ActivityIndicator style={{ marginTop: 40 }} size="large" />
      </ScreenWrapper>
    );
  }

  if (!listing) {
    return (
      <ScreenWrapper>
        <AppText>Listing not found.</AppText>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        {listing.image_url && <Image source={{ uri: listing.image_url }} style={styles.image} />}
        <AppText style={styles.title}>{listing.title}</AppText>
        <AppText style={styles.text}>{listing.description}</AppText>
        <AppText style={styles.text}>Category: {listing.category}</AppText>

        <TouchableOpacity onPress={startConversation} style={styles.button}>
          <AppText style={styles.buttonText}>Message Owner</AppText>
        </TouchableOpacity>

        <AppButton
          title={sendingHelpful ? 'Sending...' : 'Mark Helpful'}
          onPress={handleMarkHelpful}
          disabled={sendingHelpful}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  image: { width: '100%', height: 250, borderRadius: 8 },
  title: { fontSize: 24, fontWeight: '700', marginVertical: 10 },
  text: { fontSize: 16, marginVertical: 4 },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
