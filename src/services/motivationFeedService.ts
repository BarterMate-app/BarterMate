// File: src/services/motivationFeedService.ts
import { supabase } from '../supabase';

export interface MotivationFeedItem {
  id: string;
  title?: string;
  description?: string;
  image_url?: string | null;
  is_free?: boolean;
  rating?: number | null;
  review?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  type?: string; // e.g. 'free', 'great_trade', 'top_user', 'appreciated'
}

/**
 * Fetch latest 10 free trade listings with related user info.
 */
export async function fetchMotivationFeed(): Promise<MotivationFeedItem[]> {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      description,
      image_url,
      is_free,
      created_at,
      user: user_id (
        id,
        username,
        avatar_url,
        rating,
        bio
      )
    `)
    .eq('is_free', true)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching motivation feed:', error);
    throw error;
  }

  // Map user fields up one level for easier usage
  return (data ?? []).map((item) => ({
    ...item,
    username: item.user?.username ?? null,
    avatar_url: item.user?.avatar_url ?? null,
    bio: item.user?.bio ?? null,
    type: 'free',
  }));
}

/**
 * Fetch top generous users by counting gifts received
 */
export async function fetchTopGenerousUsers(limit = 10) {
  // Group gifts by receiver, count gifts
  const { data, error } = await supabase
    .from('appreciation_gifts')
    .select('receiver_id, count:id', { count: 'exact' })
    .group('receiver_id')
    .order('count', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data ?? [];
}
