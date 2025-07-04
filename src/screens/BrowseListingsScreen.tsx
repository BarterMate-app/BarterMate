import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { fetchListings } from '../services/listingsService';
import ScreenWrapper from '../components/ScreenWrapper';
import AppText from '../components/AppText';
import { colors, spacing, typography } from '../theme';
import CustomMap from '../components/CustomMap';

interface Listing {
  id: string | number;
  title: string;
  description: string;
  lat?: number;
  lon?: number;
}

export default function BrowseListingsScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

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

  // Prepare markers for the map
  const markers = listings
    .filter((l) => l.lat !== undefined && l.lon !== undefined)
    .map((l) => ({
      id: l.id,
      latitude: l.lat!,
      longitude: l.lon!,
      title: l.title,
    }));

  return (
    <ScreenWrapper>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          onPress={() => setShowMap(false)}
          style={[styles.toggleButton, !showMap && styles.toggleButtonActive]}
        >
          <AppText style={!showMap ? styles.toggleTextActive : styles.toggleText}>
            List View
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowMap(true)}
          style={[styles.toggleButton, showMap && styles.toggleButtonActive]}
        >
          <AppText style={showMap ? styles.toggleTextActive : styles.toggleText}>
            Map View
          </AppText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : showMap ? (
        markers.length > 0 ? (
          <CustomMap
            initialRegion={{
              latitude: markers[0].latitude,
              longitude: markers[0].longitude,
              latitudeDelta: 0.3,
              longitudeDelta: 0.3,
            }}
            markers={markers}
          />
        ) : (
          <View style={styles.center}>
            <AppText>No listings with location data to show on the map.</AppText>
          </View>
        )
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.listing}>
              <AppText style={styles.title}>{item.title}</AppText>
              <AppText>{item.description}</AppText>
            </View>
          )}
          contentContainerStyle={{
            padding: spacing.medium,
            flexGrow: 1,
          }}
          ListEmptyComponent={() =>
            loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <View style={styles.center}>
                <AppText>No listings found.</AppText>
              </View>
            )
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listing: {
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderColor: colors.mediumGray,
  },
  title: {
    fontWeight: 'bold',
    fontSize: typography.fontSize.medium,
    marginBottom: spacing.small,
    color: colors.textPrimary,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    color: colors.primary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: 'white',
    fontWeight: '700',
  },
});
