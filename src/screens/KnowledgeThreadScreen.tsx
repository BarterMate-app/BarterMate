// src/screens/KnowledgeThreadScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { supabase } from '../supabase';
import { useUser } from '../utils/useUser';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import ScreenWrapper from '../components/ScreenWrapper';
import AppText from '../components/AppText';
import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import { colors, spacing, typography } from '../theme';

type KnowledgeThreadRouteProp = RouteProp<RootStackParamList, 'KnowledgeThread'>;

interface KnowledgeReply {
  id: string;
  thread_id: string;
  user_id: string;
  content: string;
  is_confirmed: boolean;
  created_at: string;
  user?: {
    username: string;
  };
}

export default function KnowledgeThreadScreen() {
  const route = useRoute<KnowledgeThreadRouteProp>();
  const threadId = route.params?.threadId;

  const user = useUser();

  const [replies, setReplies] = useState<KnowledgeReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [listingOwnerId, setListingOwnerId] = useState<string | null>(null);

  useEffect(() => {
    if (!threadId) {
      Alert.alert('Error', 'Thread ID not provided');
      return;
    }
    fetchReplies();
    fetchListingOwner();
  }, [threadId]);

  const fetchReplies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_replies')
        .select('*, user:user_id (username)')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReplies(data || []);
    } catch (error) {
      console.error('Error fetching replies:', error);
      Alert.alert('Error', 'Failed to load replies.');
    } finally {
      setLoading(false);
    }
  };

  const fetchListingOwner = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_threads')
        .select('listing_id')
        .eq('id', threadId)
        .single();

      if (error) throw error;

      const listingId = data.listing_id;
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select('user_id')
        .eq('id', listingId)
        .single();

      if (listingError) throw listingError;

      setListingOwnerId(listingData.user_id);
    } catch (error) {
      console.error('Error fetching listing owner:', error);
    }
  };

  const handlePostReply = async () => {
    if (!newReply.trim()) {
      Alert.alert('Please enter your reply.');
      return;
    }
    if (!user) {
      Alert.alert('You must be logged in to post a reply.');
      return;
    }

    try {
      const { error } = await supabase.from('knowledge_replies').insert({
        thread_id: threadId,
        user_id: user.id,
        content: newReply.trim(),
        is_confirmed: false,
      });
      if (error) throw error;

      setNewReply('');
      fetchReplies();
    } catch (error) {
      console.error('Failed to post reply:', error);
      Alert.alert('Error', 'Could not post reply.');
    }
  };

  const handleMarkHelpful = async (replyId: string, currentlyConfirmed: boolean) => {
    if (!user) {
      Alert.alert('You must be logged in.');
      return;
    }
    if (user.id !== listingOwnerId) {
      Alert.alert('Only the listing owner can mark replies as helpful.');
      return;
    }

    try {
      const { error } = await supabase
        .from('knowledge_replies')
        .update({ is_confirmed: !currentlyConfirmed })
        .eq('id', replyId);
      if (error) throw error;

      fetchReplies();
    } catch (error) {
      console.error('Failed to update confirmation:', error);
      Alert.alert('Error', 'Could not update reply confirmation.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReplies();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={styles.container}>
      <FlatList
        data={replies}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.replyCard}>
            <AppText style={styles.replyUser}>{item.user?.username || 'Anonymous'}</AppText>
            <AppText style={styles.replyContent}>{item.content}</AppText>
            <View style={styles.replyFooter}>
              <AppText style={{ color: item.is_confirmed ? 'green' : 'gray' }}>
                {item.is_confirmed ? 'Marked Helpful' : 'Not Marked'}
              </AppText>
              {user?.id === listingOwnerId && (
                <AppButton
                  title={item.is_confirmed ? 'Unmark' : 'Mark Helpful'}
                  onPress={() => handleMarkHelpful(item.id, item.is_confirmed)}
                  loading={false}
                  disabled={false}
                />
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={<AppText>No replies yet. Be the first to help!</AppText>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      <View style={styles.inputContainer}>
        <AppTextInput
          placeholder="Write your reply..."
          value={newReply}
          onChangeText={setNewReply}
          style={styles.textInput}
          multiline
        />
        <AppButton title="Post Reply" onPress={handlePostReply} loading={false} disabled={false} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  replyCard: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
  },
  replyUser: { fontWeight: 'bold', marginBottom: 6 },
  replyContent: { fontSize: 16, marginBottom: 10 },
  replyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputContainer: { marginTop: 10 },
  textInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    fontSize: 16,
  },
});
