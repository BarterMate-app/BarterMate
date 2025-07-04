import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  useNavigation,
  NavigationProp,
  useFocusEffect,
} from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../supabase';
import { useUser } from '../utils/useUser';
import ScreenWrapper from '../components/ScreenWrapper';
import AppText from '../components/AppText';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  related_thread_id?: string | null;
  related_listing_id?: string | null;
  related_conversation_id?: string | null;
  created_at: string;
  read: boolean;
}

export default function NotificationsScreen() {
  const user = useUser();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to fetch notifications');
        return;
      }

      setNotifications(data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Unexpected error fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const subscription = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) fetchNotifications();
    }, [user])
  );

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to mark notification as read');
        return;
      }

      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Unexpected error marking notification as read');
    }
  };

  const onNotificationPress = async (notif: Notification) => {
    if (!user) return;

    if (!notif.read) await markAsRead(notif.id);

    switch (notif.type) {
      case 'reply_posted':
      case 'marked_helpful':
        if (notif.related_thread_id) {
          navigation.navigate('KnowledgeThread', {
            threadId: notif.related_thread_id,
          });
        }
        break;

      case 'new_message':
        if (notif.related_conversation_id) {
          navigation.navigate('Conversation', {
            conversationId: notif.related_conversation_id,
          });
        }
        break;

      case 'trade_completed':
        if (notif.related_listing_id) {
          navigation.navigate('ListingDetails', {
            listingId: notif.related_listing_id,
          });
        }
        break;

      default:
        Alert.alert('Notification', notif.message);
        break;
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        item.read ? styles.read : styles.unread,
      ]}
      onPress={() => onNotificationPress(item)}
    >
      <AppText style={styles.message}>{item.message}</AppText>
      <AppText style={styles.date}>
        {new Date(item.created_at).toLocaleString()}
      </AppText>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ScreenWrapper style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <AppText>Loading Notifications...</AppText>
      </ScreenWrapper>
    );
  }

  if (!user) {
    return (
      <ScreenWrapper style={styles.center}>
        <AppText>Please log in to view notifications.</AppText>
      </ScreenWrapper>
    );
  }

  if (notifications.length === 0) {
    return (
      <ScreenWrapper style={styles.center}>
        <AppText>No notifications yet.</AppText>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20 },
  notificationItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#e3f2fd',
  },
  unread: {
    backgroundColor: '#bbdefb',
  },
  read: {
    backgroundColor: '#f0f0f0',
  },
  message: {
    fontSize: 16,
    marginBottom: 6,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
});
