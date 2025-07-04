import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { fetchMotivationFeed } from '../services/motivationFeedService';
import { useUser } from '../utils/useUser';
import { supabase } from '../supabase';
import ScreenWrapper from '../components/ScreenWrapper';
import AppText from '../components/AppText';
import { colors, spacing, typography } from '../theme';

const { width } = Dimensions.get('window');

const localColors = {
  premiumGold: '#FFD700',
};

interface MotivationItem {
  id: string;
  title: string;
  description: string;
  username?: string;
  image_url?: string | null;
}

interface IconButtonWithBadgeProps {
  iconName: string;
  label: string;
  onPress: () => void;
  badgeCount?: number;
}

function IconButtonWithBadge({
  iconName,
  label,
  onPress,
  badgeCount = 0,
}: IconButtonWithBadgeProps) {
  return (
    <TouchableOpacity style={styles.iconButton} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.iconButtonContent}>
        <Ionicons name={iconName} size={26} color="#fff" />
        <AppText style={styles.iconButtonText}>{label}</AppText>
      </View>
      {badgeCount > 0 && (
        <View style={styles.badge}>
          <AppText style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</AppText>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useUser();

  const [motivationFeed, setMotivationFeed] = useState<MotivationItem[]>([]);
  const [loadingMotivationFeed, setLoadingMotivationFeed] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const loadFeed = async () => {
    try {
      const data = await fetchMotivationFeed();
      setMotivationFeed(data);
    } catch (e) {
      console.error('Failed to load motivation feed', e);
      setMotivationFeed([]);
    } finally {
      setLoadingMotivationFeed(false);
    }
  };

  const fetchUnreadCounts = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setUnreadNotificationsCount(notifCount || 0);

      const { count: msgCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('read', false);

      setUnreadMessagesCount(msgCount || 0);
    } catch (e) {
      console.error('Failed to fetch unread counts', e);
    }
  }, [user]);

  useEffect(() => {
    loadFeed();
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadNotificationsCount(0);
      setUnreadMessagesCount(0);
      return;
    }

    fetchUnreadCounts();

    const notifChannel = supabase
      .channel(`public:notifications:user_id=eq.${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchUnreadCounts)
      .subscribe();

    const msgChannel = supabase
      .channel(`public:messages:recipient_id=eq.${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchUnreadCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [user, fetchUnreadCounts]);

  const isPremium = user?.premium_until && new Date(user.premium_until) > new Date();

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  const renderMotivationItem = ({ item }: { item: MotivationItem }) => (
    <View style={styles.motivationCard}>
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.motivationImage} />
      )}
      <AppText style={styles.motivationTitle}>{item.title}</AppText>
      <AppText style={styles.motivationSub}>{item.description}</AppText>
      <AppText style={styles.motivationUser}>By: {item.username}</AppText>
    </View>
  );

  return (
    <ScreenWrapper style={styles.container}>
      <AppText style={styles.title}>Welcome to BarterMate</AppText>

      {isPremium && (
        <View style={[styles.premiumBadge, { backgroundColor: localColors.premiumGold }]}>
          <AppText style={styles.premiumText}>🌟 Premium Member</AppText>
        </View>
      )}

      <IconButtonWithBadge iconName="list-outline" label="Browse Listings" onPress={() => navigation.navigate('Listings')} />
      <IconButtonWithBadge iconName="add-circle-outline" label="New Listing" onPress={() => navigation.navigate('NewListing')} />
      <IconButtonWithBadge iconName="chatbubble-ellipses-outline" label="Messages" badgeCount={unreadMessagesCount} onPress={() => navigation.navigate('Messages')} />
      <IconButtonWithBadge iconName="notifications-outline" label="Notifications" badgeCount={unreadNotificationsCount} onPress={() => navigation.navigate('Notifications')} />
      <IconButtonWithBadge iconName="person-outline" label="My Profile" onPress={() => navigation.navigate('UserProfile', { userId: user?.id || '' })} />

      <AppText style={styles.motivationHeading}>Motivational Trades</AppText>

      <FlatList
        data={motivationFeed}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderMotivationItem}
        style={styles.motivationList}
        pagingEnabled
        snapToAlignment="center"
        decelerationRate="fast"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={() =>
          loadingMotivationFeed ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <AppText style={styles.emptyText}>No motivational trades yet. Be the first to trade!</AppText>
          )
        }
        contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 5 }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  premiumBadge: {
    padding: 8,
    borderRadius: 10,
    marginBottom: 15,
    alignSelf: 'center',
  },
  premiumText: { fontWeight: 'bold', fontSize: 16, color: colors.textPrimary },
  iconButton: {
    backgroundColor: '#2196F3',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
  },
  iconButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButtonText: {
    color: 'white',
    fontSize: 18,
    marginLeft: 12,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: 'red',
    borderRadius: 12,
    minWidth: 26,
    paddingHorizontal: 6,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  motivationHeading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 10,
    alignSelf: 'center',
    color: '#222',
  },
  motivationList: { maxHeight: 220 },
  motivationCard: {
    width: width * 0.75,
    backgroundColor: '#f0f8ff',
    borderRadius: 14,
    padding: 15,
    marginHorizontal: 10,
    elevation: 3,
  },
  motivationImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: colors.textPrimary,
  },
  motivationSub: { fontSize: 14, marginBottom: 8, color: '#555' },
  motivationUser: { fontSize: 12, fontStyle: 'italic', color: '#555' },
  emptyText: { textAlign: 'center', fontSize: 16, marginTop: 20, color: '#888' },
});
