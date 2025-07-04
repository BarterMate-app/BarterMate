// File: src/services/reviewsService.ts
import { supabase } from '../supabase';

export type Review = {
  id: string;
  reviewed_user_id: string;
  reviewer_user_id: string;
  text: string;
  created_at: string;
};

/**
 * Fetch all reviews for a specific user, newest first.
 * @param userId - ID of the user whose reviews to fetch
 * @returns list of reviews
 */
export const fetchUserReviews = async (userId: string): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('reviewed_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Review[];
};

/**
 * Add a new review for a user.
 * Requires the current user to be authenticated and eligible to review (e.g. completed trade).
 * @param reviewedUserId - ID of the user being reviewed
 * @param text - review text content
 * @returns inserted review record(s)
 */
export const addReview = async (
  reviewedUserId: string,
  text: string
): Promise<Review[]> => {
  // Get current logged-in user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const reviewerId = userData.user?.id;
  if (!reviewerId) throw new Error('User not authenticated');

  // Call RPC to check eligibility to review
  const { data: canReview, error: rpcError } = await supabase.rpc('can_user_review', {
    reviewer_id: reviewerId,
    reviewed_user_id: reviewedUserId,
  });

  if (rpcError) throw rpcError;

  if (!canReview) {
    throw new Error('You can only review users you have completed a trade with.');
  }

  // Insert review
  const { data, error } = await supabase.from('reviews').insert([
    {
      reviewed_user_id: reviewedUserId,
      reviewer_user_id: reviewerId,
      text,
    },
  ]);

  if (error) throw error;
  return data as Review[];
};
