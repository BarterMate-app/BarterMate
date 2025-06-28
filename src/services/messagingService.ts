import { supabase } from '../supabase';

export const fetchMessages = async (senderId: string, recipientId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${senderId},recipient_id.eq.${recipientId}`)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

export const sendMessage = async (message: any) => {
  const { data, error } = await supabase.from('messages').insert([message]);
  if (error) throw error;
  return data;
};
