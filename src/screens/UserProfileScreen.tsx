import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  ToastAndroid,
  Platform,
} from 'react-native';
import {
  RouteProp,
  useRoute,
  useNavigation,
  NavigationProp,
} from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../supabase';
import { fetchUserReviews, addReview, Review } from '../services/reviewsService';
import { sendAppreciationGift, countGiftsForUser } from '../services/giftService';
import { useUser } from '../utils/useUser';

import AppText from '../components/AppText';
import AppTextInput from '../components/AppTextInput';
import AppButton from '../components/AppButton';

import { colors, spacing, textStyles, fontSizes } from '../theme';

type UserProfileScreenRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;

type User = {
  id: string;
  free_trades_count?: number;
  special_rating?: number;
  is_premium?: boolean;
  profile_picture_url?: string;
  username?: string;
  bio?: string;
};

export default function UserProfileScreen() {
  const { params } = useRoute<UserProfileScreenRouteProp>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const loggedInUser = useUser();
  const userIdParam = params?.userId;
  const userId = userIdParam || loggedInUser?.id;

  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewText, setNewReviewText] = useState('');
  const [canReview, setCanReview] = useState(false);
  const [giftCount, setGiftCount] = useState(0);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendingGift, setSendingGift] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUser();
      loadReviews();
      checkTradeEligibility();
      fetchGiftCount();
    }
  }, [userId]);

  const loadUser = async () => {
    setLoadingUser(true);
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        free_trades_count,
        special_rating,
        is_premium,
        profile_picture_url,
        username,
        bio
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error loading user:', error);
      Alert.alert('Error', 'Failed to load user data.');
    } else {
      setUser(data);
    }
    setLoadingUser(false);
  };

  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      const revs = await fetchUserReviews(userId!);
      setReviews(revs);
    } catch (error) {
      console.error('Error loading reviews:', error);
      Alert.alert('Error', 'Failed to load reviews.');
    }
    setLoadingReviews(false);
  };

  const checkTradeEligibility = async () => {
    if (!loggedInUser || !userId || loggedInUser.id === userId) {
      setCanReview(false);
      return;
    }
    const { data, error } = await supabase
      .from('trade_history')
      .select('id')
      .or(`and(accepted_by.eq.${loggedInUser.id},offered_by.eq.${userId}),and(offered_by.eq.${loggedInUser.id},accepted_by.eq.${userId})`)
      .not('completed_at', 'is', null)
      .limit(1);

    if (error) {
      console.error('Error checking trade history:', error);
      setCanReview(false);
    } else {
      setCanReview(data && data.length > 0);
    }
  };

  const fetchGiftCount = async () => {
    try {
      const count = await countGiftsForUser(userId!);
      setGiftCount(count);
    } catch (error) {
      console.error('Error fetching gift count:', error);
    }
  };

  const submitReview = async () => {
    if (!loggedInUser) {
      Alert.alert('Login required', 'You must be logged in to submit a review.');
      return;
    }
    if (loggedInUser.id === userId) {
      Alert.alert('Invalid action', "You can't review yourself.");
      return;
    }
    if (!newReviewText.trim()) {
      Alert.alert('Please enter a review');
      return;
    }

    setSubmitting(true);
    try {
      await addReview(userId!, newReviewText.trim());
      setNewReviewText('');
      await loadReviews();
      Alert.alert('Success', 'Review submitted!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit review.');
    }
    setSubmitting(false);
  };

  const handleSendGift = async () => {
    setSendingGift(true);
    try {
      await sendAppreciationGift(userId!, 'Thanks for the trade!');
      if (Platform.OS === 'android') {
        ToastAndroid.show('🎁 Gift sent!', ToastAndroid.SHORT);
      }
      await fetchGiftCount();
    } catch (error) {
      Alert.alert('Error', 'Could not send gift.');
      console.error(error);
    }
    setSendingGift(false);
  };

  if (loadingUser) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText>Loading user data...</AppText>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <AppText>User not found.</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppButton title="Back" onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')} />

      <Image source={user.profile_picture_url ? { uri: user.profile_picture_url } : require('../../assets/default-avatar.png')} style={styles.avatar} />
      <AppText style={styles.username}>{user.username || 'No username'}</AppText>
      <AppText style={styles.bio}>{user.bio || 'No bio available'}</AppText>

      {loggedInUser?.id === user.id && (
        <>
          <AppButton title="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
          <AppButton title="Premium Benefits" onPress={() => navigation.navigate('PremiumBenefits')} />
        </>
      )}

      {user.is_premium && (
        <View style={styles.premiumBadge}>
          <AppText style={styles.premiumText}>🌟 Premium User</AppText>
        </View>
      )}

      {giftCount >= 3 && (
        <View style={styles.giftBadge}>
          <AppText style={styles.giftText}>🎁 Generous Soul ({giftCount})</AppText>
        </View>
      )}

      {loggedInUser?.id !== user.id && (
        <AppButton title={sendingGift ? 'Sending...' : 'Send Gift 🎁'} onPress={handleSendGift} disabled={sendingGift} />
      )}

      <AppText style={styles.sectionTitle}>Reviews</AppText>

      {loadingReviews ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : reviews.length === 0 ? (
        <AppText>No reviews yet.</AppText>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.reviewItem}>
              <AppText>{item.text}</AppText>
              <AppText style={styles.reviewMeta}>By {item.reviewer_user_id} on {new Date(item.created_at).toLocaleDateString()}</AppText>
            </View>
          )}
        />
      )}

      {canReview && (
        <>
          <AppTextInput style={styles.input} placeholder="Write a review..." value={newReviewText} onChangeText={setNewReviewText} multiline editable={!submitting} />
          <AppButton title={submitting ? 'Submitting...' : 'Submit Review'} onPress={submitReview} disabled={submitting} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.medium, flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: spacing.medium },
  username: { ...textStyles.heading2, marginBottom: spacing.small },
  bio: { fontStyle: 'italic', marginBottom: spacing.large, color: colors.textSecondary },
  premiumBadge: {
    backgroundColor: '#ffd700',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: spacing.large,
  },
  premiumText: { color: colors.textPrimary, fontWeight: 'bold', fontSize: fontSizes.heading2 },
  giftBadge: {
    backgroundColor: '#ffa500',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: spacing.large,
  },
  giftText: { color: colors.textPrimary, fontWeight: 'bold', fontSize: fontSizes.heading2 },
  sectionTitle: { fontSize: fontSizes.heading2, marginTop: spacing.medium, marginBottom: spacing.medium },
  reviewItem: { backgroundColor: colors.backgroundLight, padding: spacing.medium, marginBottom: spacing.small, borderRadius: 5 },
  reviewMeta: { fontSize: fontSizes.small, color: colors.textSecondary, marginTop: spacing.small },
  input: { borderWidth: 1, borderColor: colors.border, padding: spacing.medium, marginVertical: spacing.medium, borderRadius: 5, minHeight: 60, textAlignVertical: 'top', color: colors.textPrimary },
});
