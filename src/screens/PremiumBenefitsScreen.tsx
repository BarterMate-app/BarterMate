import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import AppText from '../components/AppText';
import AppButton from '../components/AppButton';
import { colors, spacing } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PremiumBenefits'>;

export default function PremiumBenefitsScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppText style={styles.heading}>✨ Premium Membership Perks ✨</AppText>

      <AppText style={styles.benefit}>✅ Priority listing placement</AppText>
      <AppText style={styles.benefit}>✅ Extra wishlist slots</AppText>
      <AppText style={styles.benefit}>✅ Access exclusive premium-only categories</AppText>
      <AppText style={styles.benefit}>✅ Custom profile themes & listing covers</AppText>
      <AppText style={styles.benefit}>✅ Achievements & unlockable badges</AppText>
      <AppText style={styles.benefit}>✅ Early access to new features</AppText>
      <AppText style={styles.benefit}>✅ No transaction fees, now or ever</AppText>
      <AppText style={styles.benefit}>✅ No third-party ads — ever</AppText>

      <AppText style={styles.subtext}>
        We're committed to a fair, community-first marketplace.
        Your support through Premium helps us keep the platform free from intrusive ads and fees. 🎉
      </AppText>

      <AppButton
        title="Back to Home"
        onPress={() => navigation.navigate('Home')}
        variant="primary"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.large,
    paddingBottom: spacing.xlarge,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: spacing.large,
    textAlign: 'center',
    color: colors.primary,
  },
  benefit: {
    fontSize: 18,
    marginBottom: spacing.medium,
    color: colors.textPrimary,
  },
  subtext: {
    fontSize: 14,
    marginTop: spacing.large,
    marginBottom: spacing.large,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
