import { supabase } from '../supabase';

/**
 * Sign up a new user with email and password.
 * Returns the created user object.
 */
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
};

/**
 * Sign in an existing user with email and password.
 * Returns the authenticated user object.
 */
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
};

/**
 * Sign out the current logged-in user.
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Get the current logged-in user's ID.
 * Returns the user ID string or null if no user is logged in.
 */
export const getUserId = async (): Promise<string | null> => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    console.error('Error getting user:', error);
    return null;
  }
  return data.user.id;
};

/**
 * Listen for authentication state changes (login, logout, token refresh).
 * Pass a callback to handle events and session updates.
 * Returns a subscription object with unsubscribe method.
 */
export const onAuthStateChange = (
  callback: (event: string, session: any) => void
) => {
  const { data: subscription } = supabase.auth.onAuthStateChange(callback);
  return subscription;
};

/**
 * Get current active session (includes user and tokens).
 */
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return data.session;
};

/**
 * Send password reset email to user.
 * Includes redirect URL after user clicks the reset link.
 */
export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://bartermate-app.netlify.app/bartermate-legal/reset-success.html', // Correct URL for your Netlify page
  });
  if (error) throw error;
};

/**
 * Update user profile info.
 * Accepts partial user update fields like email, password, or user_metadata.
 * Returns updated user object.
 */
export const updateUserProfile = async (updates: {
  email?: string;
  password?: string;
  user_metadata?: Record<string, any>;
}) => {
  const { data, error } = await supabase.auth.updateUser(updates);
  if (error) throw error;
  return data.user;
};
