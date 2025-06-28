import { supabase } from '../supabase';

export const fetchListings = async () => {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const createListing = async (listing: any) => {
  const { data, error } = await supabase.from('listings').insert([listing]);
  if (error) throw error;
  return data;
};
