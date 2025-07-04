import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../supabase';
import { useUser } from '../utils/useUser';
import { RouteProp, useRoute, useIsFocused } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  fetchMessages,
  sendMessage,
  markMessagesAsRead,
  Message,
} from '../services/messagesService';
import {
  setTypingStatus,
  subscribeToTypingStatus,
} from '../services/typingStatusService';

import AppText from '../components/AppText';
import AppTextInput from '../components/AppTextInput';

import { colors } from '../theme';

type ConversationRouteProp = RouteProp<RootStackParamList, 'Conversation'>;

export default function ConversationScreen() {
  const route = useRoute<ConversationRouteProp>();
  const isFocused = useIsFocused();
  const { otherUserId, listingId: rawListingId } = route.params;
  const user = useUser();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [offerCategory, setOfferCategory] = useState('');
  const [offerDetails, setOfferDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const flatListRef = useRef<FlatList<Message>>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  // Normalize listingId: string | null --> string | undefined
  const listingId: string | undefined =
    rawListingId && rawListingId.length > 0 ? rawListingId : undefined;

  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <AppText>Loading user info...</AppText>
      </View>
    );
  }

  const userId = user.id;
  const conversationId =
    [userId, otherUserId].sort().join('-') + (listingId ? '-' + listingId : '');

  useEffect(() => {
    let mounted = true;
    if (!user || !otherUserId) return;

    async function loadMessages() {
      setLoading(true);
      try {
        const msgs = await fetchMessages(userId, otherUserId, listingId);
        if (mounted) setMessages(msgs);
      } catch (err) {
        if (mounted) Alert.alert('Error', 'Failed to fetch messages.');
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    }

    loadMessages();

    const messageSubscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as Message;
          const relevantConversation =
            (newMessage.sender_id === userId && newMessage.receiver_id === otherUserId) ||
            (newMessage.sender_id === otherUserId && newMessage.receiver_id === userId);

          const relevantListing = listingId ? newMessage.listing_id === listingId : true;

          if (relevantConversation && relevantListing) {
            setMessages((prev: Message[]) => [...prev, newMessage]);
            scrollToBottom();
          }
        }
      )
      .subscribe();

    const typingSubscription = subscribeToTypingStatus(
      conversationId,
      (typingUserId: string, isTyping: boolean) => {
        if (typingUserId !== userId) {
          setOtherUserTyping(isTyping);
        }
      }
    );

    // Cleanup on unmount
    return () => {
      mounted = false;
      supabase.removeChannel(messageSubscription);
      supabase.removeChannel(typingSubscription);

      // Clear own typing status when leaving screen
      setTypingStatus(conversationId, userId, false).catch(console.error);
    };
  }, [userId, otherUserId, listingId, conversationId]);

  useEffect(() => {
    if (isFocused && otherUserId) {
      markMessagesAsRead(otherUserId, userId, listingId).catch(console.error);
    }
  }, [isFocused, userId, otherUserId, listingId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Throttled typing status sender to avoid excessive calls
  const handleTyping = (text: string) => {
    setInput(text);

    const now = Date.now();
    if (now - lastTypingSentRef.current > 1000) {
      // Send typing status update every 1 second max
      setTypingStatus(conversationId, userId, text.length > 0).catch(console.error);
      lastTypingSentRef.current = now;
    }

    // Also send "stopped typing" after 2 seconds of inactivity
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(conversationId, userId, false).catch(console.error);
    }, 2000);
  };

  const onSend = async () => {
    if (!input.trim() && !offerCategory.trim() && !offerDetails.trim()) {
      Alert.alert('Please enter a message or offer details.');
      return;
    }
    if (!otherUserId) {
      Alert.alert('User info missing');
      return;
    }

    try {
      const newMsg = await sendMessage({
        sender_id: userId,
        receiver_id: otherUserId,
        content: input.trim(),
        offer_category: offerCategory.trim() || null,
        offer_details: offerDetails.trim() || null,
        listing_id: listingId || null,
      });

      setMessages((prev: Message[]) => [...prev, newMsg]);
      scrollToBottom();

      setInput('');
      setOfferCategory('');
      setOfferDetails('');
      Keyboard.dismiss();

      // Clear typing status after sending
      await setTypingStatus(conversationId, userId, false);
    } catch (err) {
      Alert.alert('Error', 'Failed to send message.');
      console.error(err);
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isSentByUser = item.sender_id === userId;

    return (
      <View
        style={[
          styles.messageContainer,
          isSentByUser ? styles.sentMessage : styles.receivedMessage,
        ]}
      >
        {(item.offer_category || item.offer_details) && (
          <>
            <AppText style={styles.offerLabel}>Offer:</AppText>
            {item.offer_category && (
              <AppText style={styles.offerCategory}>Category: {item.offer_category}</AppText>
            )}
            {item.offer_details && (
              <AppText style={styles.offerDetails}>{item.offer_details}</AppText>
            )}
          </>
        )}
        {item.content ? (
          <AppText style={styles.messageText}>{item.content}</AppText>
        ) : null}
        <AppText style={styles.timestamp}>
          {new Date(item.created_at).toLocaleString()}
        </AppText>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToBottom}
      />

      {otherUserTyping && (
        <View style={styles.typingIndicator}>
          <AppText style={{ fontStyle: 'italic' }}>The other person is typing…</AppText>
        </View>
      )}

      <View style={styles.inputContainer}>
        <AppTextInput
          placeholder="Type your message..."
          value={input}
          onChangeText={handleTyping}
          style={styles.textInput}
          multiline
          returnKeyType="send"
          onSubmitEditing={onSend}
        />
        <AppTextInput
          placeholder="Offer category (optional)"
          value={offerCategory}
          onChangeText={setOfferCategory}
          style={styles.offerInput}
        />
        <AppTextInput
          placeholder="Offer details (optional)"
          value={offerDetails}
          onChangeText={setOfferDetails}
          style={styles.offerInput}
          multiline
        />
        <TouchableOpacity onPress={onSend} style={styles.sendButton}>
          <AppText style={styles.sendButtonText}>Send</AppText>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  messagesList: { padding: 10 },
  messageContainer: {
    marginVertical: 6,
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECECEC',
  },
  messageText: { fontSize: 16 },
  offerLabel: { fontWeight: '700', color: '#1E90FF', marginBottom: 4 },
  offerCategory: { fontWeight: '600', fontSize: 14, color: colors.textPrimary },
  offerDetails: { fontSize: 14, color: '#555', marginBottom: 4 },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  inputContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  textInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginBottom: 6,
  },
  offerInput: {
    height: 40,
    borderColor: '#aaa',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginBottom: 6,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
