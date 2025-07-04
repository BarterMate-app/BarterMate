import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { fetchListings } from '../services/listingsService';
import CustomMap from '../components/CustomMap';
import { colors } from '../theme';
import { useRoute, RouteProp } from '@react-navigation/native';

type BrowseListingsMapRouteProp = RouteProp<
  {
    BrowseListingsMap: {
      initialRegion?: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
      };
      highlightListingId?: string | number | null;
    };
  },
  'BrowseListingsMap'
>;

interface Listing {
  id: string | number;
  title: string;
  lat?: number;
  lon?: number;
}

export default function BrowseListingsMapScreen() {
  const route = useRoute<BrowseListingsMapRouteProp>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    initialRegion = {
      latitude: -33.865143,
      longitude: 151.2099,
      latitudeDelta: 0.3,
      longitudeDelta: 0.3,
    },
    highlightListingId = null,
  } = route.params || {};

  useEffect(() => {
    const loadListings = async () => {
      try {
        const data = await fetchListings();
        setListings(data || []);
      } catch (error) {
        console.error('Error loading listings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadListings();
  }, []);

  // Prepare markers for the map, with isHighlighted flag
  const markers = listings
    .filter((l) => l.lat !== undefined && l.lon !== undefined)
    .map((l) => ({
      id: l.id,
      latitude: l.lat!,
      longitude: l.lon!,
      title: l.title,
      isHighlighted: highlightListingId !== null && l.id === highlightListingId,
    }));

  return (
    <ScreenWrapper>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <CustomMap
          initialRegion={initialRegion}
          markers={markers}
          highlightMarkerId={highlightListingId}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
