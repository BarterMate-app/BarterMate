// File: src/services/tradeService.ts
import { supabase } from '../supabase';

export interface TradeHistoryEntry {
  listing_id: string;
  offered_by: string;  // proposer id
  accepted_by: string; // recipient id
  created_at?: string;
  completed_at?: string | null;
  rating?: number | null;
  review?: string | null;
}

/**
 * Call this when an offer is accepted.
 * Uses a Postgres RPC function 'accept_trade' to atomically:
 * - update offer status,
 * - mark listing as traded,
 * - insert trade_history record.
 * Then sends notifications to both users asynchronously.
 */
export async function acceptTrade({
  listingId,
  proposerId,
  recipientId,
  offerId,
}: {
  listingId: string;
  proposerId: string;
  recipientId: string;
  offerId?: string | null;
}): Promise<any> {
  try {
    // Call the RPC stored procedure 'accept_trade'
    const { data, error } = await supabase.rpc('accept_trade', {
      p_listing_id: listingId,
      p_proposer_id: proposerId,
      p_recipient_id: recipientId,
      p_offer_id: offerId ?? null,
    });

    if (error) {
      console.error('acceptTrade RPC error:', error);
      throw error;
    }

    // Fire-and-forget notifications to both users
    Promise.all([
      sendNotification(proposerId, `Your offer on listing ${listingId} was accepted!`),
      sendNotification(recipientId, `You accepted an offer on listing ${listingId}.`),
    ]).catch((notifError) => {
      console.error('Notification sending error:', notifError);
    });

    return data;
  } catch (e) {
    console.error('acceptTrade error:', e);
    throw e;
  }
}

/**
 * Helper to insert a notification record for a user.
 * @param userId - target user ID
 * @param message - notification message text
 */
async function sendNotification(userId: string, message: string) {
  const { error } = await supabase.from('notifications').insert([
    {
      user_id: userId,
      message,
      read: false,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error('Failed to send notification', error);
  }
}
