// File: src/services/tradeHistoryService.ts
import { supabase } from '../supabase';

export interface TradeHistory {
  id: string;
  created_at: string;
  completed_at: string | null;
  rating?: number | null;
  review?: string | null;
  listing_id: string;
  offered_by: string;
  accepted_by: string;
  // Optional relational data:
  listings?: {
    id: string;
    title: string;
  };
  offered_by_user?: {
    username: string;
  };
  accepted_by_user?: {
    username: string;
  };
}

/**
 * Fetch trade history entries involving a specific user either as offerer or accepter.
 * Includes relational info about listing and users.
 * @param userId - ID of the user to fetch history for
 * @returns Array of TradeHistory entries
 */
export const fetchTradeHistoryForUser = async (userId: string): Promise<TradeHistory[]> => {
  const { data, error } = await supabase
    .from('trade_history')
    .select(`
      id,
      created_at,
      completed_at,
      rating,
      review,
      listing_id,
      offered_by,
      accepted_by,
      listings ( id, title ),
      offered_by_user:offered_by ( username ),
      accepted_by_user:accepted_by ( username )
    `)
    .or(`offered_by.eq.${userId},accepted_by.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as TradeHistory[];
};
