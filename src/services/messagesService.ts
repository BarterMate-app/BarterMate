import { supabase } from '../supabase';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  offer_category?: string | null;
  offer_details?: string | null;
  listing_id?: string | null;
  created_at: string;
  read: boolean;
  listings?: {
    id: string;
    title: string;
  };
}

/**
 * Fetch messages exchanged between two users, optionally filtered by a listing ID.
 * Returns messages ordered by creation time ascending.
 */
export const fetchMessages = async (
  userAId: string,
  userBId: string,
  listingId?: string | null
): Promise<Message[]> => {
  let query = supabase
    .from('messages')
    .select(`
      *,
      listings ( id, title )
    `)
    .or(
      `(sender_id.eq.${userAId},receiver_id.eq.${userBId}),` +
      `(sender_id.eq.${userBId},receiver_id.eq.${userAId})`
    )
    .order('created_at', { ascending: true });

  if (listingId) {
    query = query.eq('listing_id', listingId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch messages:', error);
    throw error;
  }

  return data ?? [];
};

/**
 * Send a message.
 * The message object should omit id, created_at, and read properties.
 * Automatically marks the new message as unread.
 * Returns the newly created message.
 */
export const sendMessage = async (
  message: Omit<Message, 'id' | 'created_at' | 'read'>
): Promise<Message> => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ ...message, read: false }])
    .select()
    .single();

  if (error) {
    console.error('Failed to send message:', error);
    throw error;
  }

  return data;
};

/**
 * Mark all unread messages sent from conversationUserId to currentUserId as read.
 * Optionally scoped to a listing ID.
 */
export const markMessagesAsRead = async (
  conversationUserId: string,
  currentUserId: string,
  listingId?: string
): Promise<void> => {
  let query = supabase
    .from('messages')
    .update({ read: true })
    .eq('receiver_id', currentUserId)
    .eq('sender_id', conversationUserId)
    .eq('read', false);

  if (listingId) {
    query = query.eq('listing_id', listingId);
  }

  const { error } = await query;
  if (error) {
    console.error('Error marking messages as read:', error);
  }
};
