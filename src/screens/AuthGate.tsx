import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../supabase';
import ScreenWrapper from '../components/ScreenWrapper';
import { colors, spacing } from '../theme';

type AuthGateProps = {
  navigation: any; // ideally replace 'any' with your typed navigation prop if you have it
};

export default function AuthGate({ navigation }: AuthGateProps) {
  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session check error:', error.message);
          navigation.replace('Login');
          return;
        }

        if (session && session.user) {
          navigation.replace('Home'); // User logged in
        } else {
          navigation.replace('Login'); // Not logged in
        }
      } catch (err) {
        console.error('Unexpected error checking session:', err);
        navigation.replace('Login');
      }
    }

    checkSession();
  }, [navigation]); // ✅ added dependency

  return (
    <ScreenWrapper style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.medium,
  },
});
