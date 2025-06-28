import { supabase } from '../supabase';

export const fetchOffers = async () => {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const createOffer = async (offer: any) => {
  const { data, error } = await supabase.from('offers').insert([offer]);
  if (error) throw error;
  return data;
};

export const updateOfferStatus = async (offerId: string, status: string) => {
  const { data, error } = await supabase
    .from('offers')
    .update({ status })
    .eq('id', offerId);
  if (error) throw error;
  return data;
};
