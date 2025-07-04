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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

import ScreenWrapper from '../components/ScreenWrapper';
import AppText from '../components/AppText';
import { colors } from '../theme';

type MessagesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Messages'
>;

interface ConversationPreview {
  conversationId: string;
  listingId: string | null;
  listingTitle: string;
  lastMessage: string;
  lastMessageDate: string;
  otherUserId: string;
  otherUserName: string;
}

export default function MessagesScreen() {
  const user = useUser();
  const navigation = useNavigation<MessagesScreenNavigationProp>();

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchConversations = async () => {
      try {
        const { data: messages, error } = await supabase
          .from('messages')
          .select(`
            id,
            listing_id,
            message,
            created_at,
            sender_id,
            receiver_id,
            listings (
              id,
              title
            ),
            sender:users!messages_sender_id_fkey (
              id,
              username
            ),
            receiver:users!messages_receiver_id_fkey (
              id,
              username
            )
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const convoMap = new Map<string, ConversationPreview>();

        messages?.forEach((msg: any) => {
          const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
          if (!otherUser) return;

          const convoKey = `${msg.listing_id ?? 'no_listing'}_${otherUser.id}`;

          const existing = convoMap.get(convoKey);

          if (
            !existing ||
            new Date(msg.created_at) > new Date(existing.lastMessageDate)
          ) {
            convoMap.set(convoKey, {
              conversationId: convoKey,
              listingId: msg.listing_id ?? null,
              listingTitle: msg.listings?.title || 'Listing',
              lastMessage: msg.message || '[Offer]',
              lastMessageDate: msg.created_at,
              otherUserId: otherUser.id,
              otherUserName: otherUser.username || 'User',
            });
          }
        });

        setConversations(Array.from(convoMap.values()));
      } catch (error) {
        Alert.alert('Error', 'Failed to load messages');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  if (loading) {
    return (
      <ScreenWrapper style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenWrapper>
    );
  }

  if (!user) {
    return (
      <ScreenWrapper style={styles.center}>
        <AppText>Please log in to view messages.</AppText>
      </ScreenWrapper>
    );
  }

  if (conversations.length === 0) {
    return (
      <ScreenWrapper style={styles.center}>
        <AppText>No conversations yet.</AppText>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.conversationId}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.conversationItem}
            onPress={() =>
              navigation.navigate('Conversation', {
                otherUserId: item.otherUserId,
                listingId: item.listingId,
              })
            }
          >
            <AppText style={styles.listingTitle}>{item.listingTitle}</AppText>
            <AppText style={styles.otherUserName}>
              Chat with: {item.otherUserName}
            </AppText>
            <AppText style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </AppText>
            <AppText style={styles.date}>
              {new Date(item.lastMessageDate).toLocaleDateString()}{' '}
              {new Date(item.lastMessageDate).toLocaleTimeString()}
            </AppText>
          </TouchableOpacity>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  conversationItem: {
    padding: 16,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    backgroundColor: colors.background,
    borderRadius: 6,
    marginBottom: 12,
    elevation: 2,
  },
  listingTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.textPrimary,
  },
  otherUserName: {
    fontStyle: 'italic',
    color: '#555',
    marginVertical: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
