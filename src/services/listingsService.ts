// File: src/services/listingsService.ts
import { supabase } from '../supabase';

export interface Listing {
  id?: string;
  user_id?: string;
  title: string;
  description: string;
  category: string;
  wanted_category?: string | null;
  wanted_details?: string | null;
  is_free?: boolean;
  lat: number;
  lon: number;
  image_url?: string | null;
  created_at?: string;

  user?: {   // included user info for premium
    id: string;
    username: string;
    is_premium: boolean;
  };
}

/**
 * Fetch all listings ordered by most recent, including user data with is_premium
 */
export const fetchListings = async (): Promise<Listing[]> => {
  const { data, error } = await supabase
    .from('listings')
    .select('*, user:users(id, username, is_premium)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch listings:', error);
    throw error;
  }

  return data as Listing[];
};

/**
 * Create a new listing associated with the authenticated user.
 */
export const createListing = async (listing: Listing): Promise<Listing[]> => {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error('Error fetching authenticated user:', userError);
    throw userError;
  }

  if (!userData?.user?.id) {
    throw new Error('User not authenticated');
  }

  const listingWithUser = {
    ...listing,
    user_id: listing.user_id ?? userData.user.id,
  };

  const { data, error } = await supabase
    .from('listings')
    .insert([listingWithUser])
    .select(); // returns the created rows

  if (error) {
    console.error('Failed to create listing:', error);
    throw error;
  }

  return data as Listing[];
};
