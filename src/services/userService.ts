// File: src/services/pushTokenService.ts
import { supabase } from '../supabase';

/**
 * Save the Expo push token for a user in their profile.
 * 
 * @param userId - The user's ID.
 * @param token - The Expo push token string.
 * @returns Updated profile data on success.
 * @throws Throws error if update fails.
 */
export async function savePushTokenForUser(userId: string, token: string) {
  const { data, error } = await supabase
    .from('profiles') // adjust table name if different
    .update({ expo_push_token: token })
    .eq('id', userId);

  if (error) {
    console.error('Failed to save push token:', error);
    throw error;
  }
  return data;
}
