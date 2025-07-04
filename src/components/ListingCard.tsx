import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, useColorScheme } from 'react-native';
import AppText from './AppText';
import { spacing } from '../theme/spacing'; // <-- fixed import path

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    description: string;
    image_url?: string | null;
    isOwner?: boolean;
    user?: {
      id: string;
      username: string;
      is_premium: boolean;
    };
  };
  onPress?: () => void;
}

export default function ListingCard({ listing, onPress }: ListingCardProps) {
  const colorScheme = useColorScheme();

  const colors = {
    background: colorScheme === 'dark' ? '#1e1e1e' : '#fff',
    textPrimary: colorScheme === 'dark' ? '#eee' : '#222',
    textSecondary: colorScheme === 'dark' ? '#bbb' : '#555',
    border: colorScheme === 'dark' ? '#333' : '#ccc',
    premiumBadgeBackground: '#FFD700',
    premiumBadgeText: '#444',
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {listing.image_url ? (
        <Image source={{ uri: listing.image_url }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: colors.border }]}>
          <AppText style={{ color: colors.textSecondary }}>No Image</AppText>
        </View>
      )}

      <View style={styles.content}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AppText style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {listing.title}
          </AppText>

          {listing.user?.is_premium && (
            <View style={[styles.premiumBadge, { backgroundColor: colors.premiumBadgeBackground }]}>
              <AppText style={[styles.premiumBadgeText, { color: colors.premiumBadgeText }]}>🌟 Premium</AppText>
            </View>
          )}

          {listing.isOwner && (
            <View style={styles.ownerBadge}>
              <AppText style={styles.ownerBadgeText}>Your Listing</AppText>
            </View>
          )}
        </View>

        <AppText style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {listing.description}
        </AppText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 6,
    overflow: 'hidden',
  },
  image: {
    height: 150,
    width: '100%',
  },
  imagePlaceholder: {
    height: 150,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.medium,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    flexShrink: 1,
  },
  description: {
    marginTop: 4,
    fontSize: 14,
  },
  premiumBadge: {
    paddingHorizontal: spacing.small,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: spacing.small,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ownerBadge: {
    marginLeft: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: spacing.small,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ownerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
