import { supabase } from '../supabase';

export async function sendAppreciationGift(receiverId: string, message: string) {
  const { data, error } = await supabase
    .from('appreciation_gifts')
    .insert([{ receiver_id: receiverId, message }]);

  if (error) throw error;
  return data;
}

export async function fetchGiftsForUser(userId: string) {
  const { data, error } = await supabase
    .from('appreciation_gifts')
    .select('*')
    .eq('receiver_id', userId);

  if (error) throw error;
  return data;
}

export async function countGiftsForUser(userId: string) {
  const { count, error } = await supabase
    .from('appreciation_gifts')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId);

  if (error) throw error;
  return count || 0;
}
