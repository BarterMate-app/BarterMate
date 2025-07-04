// File: src/services/offersService.ts
import { supabase } from '../supabase';

export interface Offer {
  id?: string;
  listing_id: string;
  proposer_id: string;
  recipient_id: string;
  message: string;
  status?: 'pending' | 'accepted' | 'declined';
  created_at?: string;
  listings?: {
    title: string;
    image_url?: string | null;
  };
}

/**
 * Fetch all offers, including related listing info, sorted by newest first.
 */
export const fetchOffers = async (): Promise<Offer[]> => {
  const { data, error } = await supabase
    .from('offers')
    .select(`
      id,
      listing_id,
      message,
      proposer_id,
      recipient_id,
      status,
      created_at,
      listings (
        title,
        image_url
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
};

/**
 * Create a new offer, default status is 'pending', adds created_at timestamp if missing.
 */
export const createOffer = async (offer: Offer): Promise<Offer[]> => {
  const { data, error } = await supabase
    .from('offers')
    .insert([
      {
        listing_id: offer.listing_id,
        proposer_id: offer.proposer_id,
        recipient_id: offer.recipient_id,
        message: offer.message,
        status: offer.status ?? 'pending',
        created_at: offer.created_at ?? new Date().toISOString(),
      },
    ])
    .select();

  if (error) throw error;
  return data ?? [];
};

/**
 * Update the status of an existing offer by ID.
 * @param offerId The offer ID to update
 * @param status New status ('pending', 'accepted', or 'declined')
 */
export const updateOfferStatus = async (
  offerId: string,
  status: 'pending' | 'accepted' | 'declined'
): Promise<Offer[]> => {
  const { data, error } = await supabase
    .from('offers')
    .update({ status })
    .eq('id', offerId)
    .select();

  if (error) throw error;
  return data ?? [];
};
