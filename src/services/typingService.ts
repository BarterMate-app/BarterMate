// File: src/services/typingStatusService.ts
import { supabase } from '../supabase';

/**
 * Set or update a user's typing status for a conversation.
 * Uses UPSERT to insert or update the typing_status row keyed by conversation_id and user_id.
 *
 * @param conversationId - ID of the conversation
 * @param userId - ID of the user whose typing status is being updated
 * @param isTyping - boolean indicating if the user is currently typing
 */
export async function setTypingStatus(
  conversationId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  const { error } = await supabase
    .from('typing_status')
    .upsert(
      {
        conversation_id: conversationId,
        user_id: userId,
        is_typing: isTyping,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'conversation_id,user_id' }
    );

  if (error) {
    console.error('Failed to update typing status:', error);
  }
}

/**
 * Subscribe to real-time updates of typing status changes for a conversation.
 *
 * @param conversationId - ID of the conversation to listen on
 * @param callback - function called when a typing status update happens, receives userId and isTyping
 * @returns Supabase realtime subscription object
 */
export function subscribeToTypingStatus(
  conversationId: string,
  callback: (userId: string, isTyping: boolean) => void
) {
  return supabase
    .channel(`typing-status-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'typing_status',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const { user_id, is_typing } = payload.new;
        callback(user_id, is_typing);
      }
    )
    .subscribe();
}
