import { supabase } from '../supabase';

const TYPING_CHANNEL_PREFIX = 'typing-status-';

/**
 * Set the typing status for a user in a conversation.
 */
export async function setTypingStatus(
  conversationId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  try {
    // Upsert typing status for this user in this conversation
    await supabase.from('typing_status').upsert({
      conversation_id: conversationId,
      user_id: userId,
      is_typing: isTyping,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error setting typing status:', error);
  }
}

/**
 * Subscribe to typing status updates in a conversation.
 * Calls the callback with (userId, isTyping) when a user's typing status changes.
 * Returns the subscription channel which you must unsubscribe on cleanup.
 */
export function subscribeToTypingStatus(
  conversationId: string,
  callback: (userId: string, isTyping: boolean) => void
) {
  const channel = supabase
    .channel(TYPING_CHANNEL_PREFIX + conversationId)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'typing_status',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const record = payload.new;
        if (record) {
          callback(record.user_id, record.is_typing);
        }
      }
    )
    .subscribe();

  return channel;
}
