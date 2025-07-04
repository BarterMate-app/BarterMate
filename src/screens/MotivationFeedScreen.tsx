// File: src/screens/MotivationFeedScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  Text,
} from 'react-native';
import { fetchMotivationFeed, fetchTopGenerousUsers, MotivationFeedItem } from '../services/motivationFeedService';
import { supabase } from '../supabase';

import ScreenWrapper from '../components/ScreenWrapper';
import AppText from '../components/AppText';
import UserListItem from '../components/UserListItem'; // new component

export default function MotivationFeedScreen() {
  const [motivationFeed, setMotivationFeed] = useState<MotivationFeedItem[]>([]);
  const [topGenerousUsers, setTopGenerousUsers] = useState<
    { receiver_id: string; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingGenerous, setLoadingGenerous] = useState(true);

  useEffect(() => {
    loadMotivationFeed();
    loadTopGenerousUsers();
  }, []);

  const loadMotivationFeed = async () => {
    setLoading(true);

    try {
      const freeTrades = await fetchMotivationFeed();

      // Fetch great rated trades
      const { data: greatTrades, error: tradeError } = await supabase
        .from('trade_history')
        .select(`
          id,
          rating,
          review,
          completed_at,
          listings:listing_id (
            id,
            title,
            description,
            image_url,
            user_id
          ),
          user:offered_by (
            id,
            username,
            avatar_url,
            bio,
            rating
          )
        `)
        .gte('rating', 4)
        .order('completed_at', { ascending: false });

      if (tradeError) throw tradeError;

      // Fetch top users by reviews (rating >=4)
      const { data: topUsers, error: reviewError } = await supabase
        .from('user_reviews')
        .select('reviewed_user_id, rating')
        .gte('rating', 4);

      if (reviewError) throw reviewError;

      const topUserIds = [...new Set(topUsers?.map((r) => r.reviewed_user_id))];

      // Fetch listings for top users
      const { data: topUserListings, error: listingError } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
          image_url,
          user_id,
          user: user_id (
            id,
            username,
            avatar_url,
            bio,
            rating
          )
        `)
        .in('user_id', topUserIds)
        .order('created_at', { ascending: false });

      if (listingError) throw listingError;

      // Fetch users who received appreciation gifts
      const { data: giftedUsers, error: giftError } = await supabase
        .from('appreciation_gifts')
        .select('receiver_id');

      if (giftError) throw giftError;

      const giftedUserIds = [...new Set(giftedUsers?.map((g) => g.receiver_id))];

      // Fetch listings from users who received gifts
      const { data: appreciatedListings, error: appreciatedError } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
          image_url,
          user_id,
          user: user_id (
            id,
            username,
            avatar_url,
            bio,
            rating
          )
        `)
        .in('user_id', giftedUserIds)
        .order('created_at', { ascending: false });

      if (appreciatedError) throw appreciatedError;

      const combinedFeed: MotivationFeedItem[] = [
        ...freeTrades.map((item) => ({ ...item, type: 'free' })),
        ...greatTrades.map((item) => ({
          id: item.id,
          title: item.listings?.title,
          description: item.listings?.description,
          image_url: item.listings?.image_url,
          rating: item.rating,
          review: item.review,
          completed_at: item.completed_at,
          username: item.user?.username,
          avatar_url: item.user?.avatar_url,
          bio: item.user?.bio,
          type: 'great_trade',
        })),
        ...topUserListings.map((item) => ({ ...item, type: 'top_user' })),
        ...appreciatedListings.map((item) => ({ ...item, type: 'appreciated' })),
      ];

      combinedFeed.sort((a, b) => {
        const dateA = new Date(a.completed_at || a.created_at || 0).getTime();
        const dateB = new Date(b.completed_at || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setMotivationFeed(combinedFeed);
    } catch (error) {
      console.error('Failed to load motivation feed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load top generous users separately and show a separate section
  const loadTopGenerousUsers = async () => {
    setLoadingGenerous(true);
    try {
      const topUsers = await fetchTopGenerousUsers(10);
      setTopGenerousUsers(topUsers);
    } catch (e) {
      console.error('Failed to load generous users', e);
    } finally {
      setLoadingGenerous(false);
    }
  };

  const badgeColors: Record<string, string> = {
    free: '#4CAF50',
    great_trade: '#FFC107',
    top_user: '#2196F3',
    appreciated: '#E91E63',
  };

  const renderMotivationItem = ({ item }: { item: MotivationFeedItem }) => {
    let badge = '';
    switch (item.type) {
      case 'free':
        badge = '🆓 Free Trade';
        break;
      case 'great_trade':
        badge = `⭐ Trade Rating: ${item.rating ?? ''}`;
        break;
      case 'top_user':
        badge = '🏅 Top Trader';
        break;
      case 'appreciated':
        badge = '🎁 Appreciated';
        break;
      default:
        badge = '';
    }

    return (
      <View style={styles.card}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <AppText style={styles.avatarInitial}>
              {item.username?.charAt(0).toUpperCase() || '?'}
            </AppText>
          </View>
        )}

        <AppText style={[styles.badge, { color: badgeColors[item.type || 'free'] }]}>
          {badge}
        </AppText>

        <AppText style={styles.title}>
          {item.title || item.description || item.review || 'No description provided'}
        </AppText>

        {item.bio ? <AppText style={styles.bio}>{item.bio}</AppText> : null}

        <AppText style={styles.date}>
          {new Date(item.completed_at || item.created_at || '').toLocaleString()}
        </AppText>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#333" />
          <AppText>Loading Motivation Feed...</AppText>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <AppText style={styles.heading}>Most Generous Users</AppText>
      {loadingGenerous ? (
        <ActivityIndicator size="small" color="#333" />
      ) : topGenerousUsers.length === 0 ? (
        <AppText style={styles.empty}>No generous users found yet.</AppText>
      ) : (
        <FlatList
          data={topGenerousUsers}
          keyExtractor={(item) => item.receiver_id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
          renderItem={({ item }) => (
            <UserListItem
              userId={item.receiver_id}
              badgeText={`🎁 Gifts: ${item.count}`}
            />
          )}
        />
      )}

      <AppText style={styles.heading}>Motivation Feed - Free & Great Trades</AppText>

      <FlatList
        data={motivationFeed}
        keyExtractor={(item, index) => item.id || `${item.type}_${index}`}
        renderItem={renderMotivationItem}
        refreshing={loading}
        onRefresh={loadMotivationFeed}
        ListEmptyComponent={
          <AppText style={styles.empty}>No motivational trades yet.</AppText>
        }
        contentContainerStyle={motivationFeed.length === 0 && styles.emptyContainer}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#222',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  badge: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bio: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 6,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 10,
  },
  avatarPlaceholder: {
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
