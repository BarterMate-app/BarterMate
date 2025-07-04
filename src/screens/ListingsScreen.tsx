import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  Animated,
  Easing,
  Text,
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import * as Network from 'expo-network';

import { getDistance } from '../utils/distanceCalculator';
import { fetchListings } from '../services/listingsService';
import ListingCard from '../components/ListingCard';
import { useUser } from '../utils/useUser';
import { supabase } from '../supabase';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

import AppText from '../components/AppText';

type ListingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Listings'
>;

interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  lat: number;
  lon: number;
  user?: {
    id: string;
    username: string;
    is_premium: boolean;
  };
  [key: string]: any;
}

const categories = [
  'service',
  'produce',
  'products',
  'experiences',
  'transport',
  'knowledge',
  'other',
];

// Custom hook for network status and event listener
function useNetworkStatus(pollIntervalMs = 5000) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkNetwork = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        setIsOffline(!state.isConnected);
      } catch {
        setIsOffline(true);
      }
    };

    checkNetwork();
    interval = setInterval(checkNetwork, pollIntervalMs);

    return () => clearInterval(interval);
  }, [pollIntervalMs]);

  return isOffline;
}

export default function ListingsScreen() {
  const navigation = useNavigation<ListingsScreenNavigationProp>();
  const user = useUser();
  const colorScheme = useColorScheme();

  const colors = {
    background: colorScheme === 'dark' ? '#121212' : '#fff',
    textPrimary: colorScheme === 'dark' ? '#fff' : '#222',
    textSecondary: colorScheme === 'dark' ? '#ccc' : '#555',
    border: colorScheme === 'dark' ? '#333' : '#ccc',
    primary: '#2196F3',
    error: '#e74c3c',
  };

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [keyword, setKeyword] = useState('');
  const [distance, setDistance] = useState(50);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isOffline = useNetworkStatus();

  const keywordTimeout = useRef<NodeJS.Timeout | null>(null);
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  const animValues = useRef<Record<string, Animated.Value>>(
    categories.reduce((acc, cat) => {
      acc[cat] = new Animated.Value(1);
      return acc;
    }, {} as Record<string, Animated.Value>)
  ).current;

  useEffect(() => {
    (async () => {
      try {
        const savedFiltersStr = await AsyncStorage.getItem('savedSearchFilters');
        if (savedFiltersStr) {
          const savedFilters = JSON.parse(savedFiltersStr);
          setKeyword(savedFilters.keyword || '');
          setDistance(savedFilters.distance || 50);
          setSelectedCategories(savedFilters.selectedCategories || []);
          setDebouncedKeyword(savedFilters.keyword || '');
        }
      } catch (e) {
        console.warn('Failed to load saved filters', e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        } else {
          setIsLoading(false);
        }
      } catch {
        setIsLoading(false);
      }
    })();
  }, []);

  const uploadDrafts = useCallback(async () => {
    try {
      const draftsStr = await AsyncStorage.getItem('listingDrafts');
      if (!draftsStr) return;
      const drafts: any[] = JSON.parse(draftsStr);

      if (drafts.length === 0) return;

      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) return;

      let remainingDrafts = [...drafts];
      let anySuccess = false;

      for (const draft of drafts) {
        try {
          const { error } = await supabase.from('listings').insert(draft);
          if (!error) {
            remainingDrafts = remainingDrafts.filter((d) => d !== draft);
            anySuccess = true;
          }
        } catch (e) {
          console.warn('Failed to upload draft:', e);
        }
      }

      if (anySuccess) {
        await AsyncStorage.setItem('listingDrafts', JSON.stringify(remainingDrafts));
      }
    } catch (e) {
      console.error('Error uploading drafts:', e);
    }
  }, []);

  const loadListings = useCallback(async () => {
    if (!location) return;
    setIsLoading(true);

    try {
      const data = await fetchListings();

      const enriched = data.map((item: Listing) => ({
        ...item,
        isOwner: user ? user.id === item.user_id : false,
      }));

      // Sort premium listings first, then by distance
      const sorted = enriched.sort((a, b) => {
        if (a.user?.is_premium && !b.user?.is_premium) return -1;
        if (!a.user?.is_premium && b.user?.is_premium) return 1;

        const distA =
          a.lat && a.lon && location
            ? getDistance(location.latitude, location.longitude, a.lat, a.lon)
            : Number.MAX_VALUE;
        const distB =
          b.lat && b.lon && location
            ? getDistance(location.latitude, location.longitude, b.lat, b.lon)
            : Number.MAX_VALUE;
        return distA - distB;
      });

      setListings(sorted);
      await AsyncStorage.setItem('cachedListings', JSON.stringify(sorted));
    } catch (error) {
      console.error('Failed to load listings:', error);
      try {
        const cachedStr = await AsyncStorage.getItem('cachedListings');
        if (cachedStr) {
          const cachedListings = JSON.parse(cachedStr);
          setListings(cachedListings);
        }
      } catch (cacheErr) {
        console.error('Failed to load cached listings:', cacheErr);
      }
    } finally {
      setIsLoading(false);
    }
  }, [location, user]);

  useEffect(() => {
    if (!location) return;

    const syncData = async () => {
      await uploadDrafts();
      await loadListings();
    };

    syncData();
  }, [location, uploadDrafts, loadListings]);

  useEffect(() => {
    if (!location) return;

    const channel = supabase
      .channel('public:listings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'listings' },
        (payload) => {
          const newListing = payload.new as Listing;

          supabase
            .from('users')
            .select('id, username, is_premium')
            .eq('id', newListing.user_id)
            .single()
            .then(({ data: userData, error }) => {
              if (error || !userData) {
                console.warn('Failed to fetch user data for new listing:', error);
              }

              const enrichedListing = {
                ...newListing,
                user: userData ?? null,
                isOwner: user ? user.id === newListing.user_id : false,
              };

              setListings((prev) => {
                const updated = [enrichedListing, ...prev];
                return updated.sort((a, b) => {
                  if (a.user?.is_premium && !b.user?.is_premium) return -1;
                  if (!a.user?.is_premium && b.user?.is_premium) return 1;

                  const distA =
                    a.lat && a.lon && location
                      ? getDistance(location.latitude, location.longitude, a.lat, a.lon)
                      : Number.MAX_VALUE;
                  const distB =
                    b.lat && b.lon && location
                      ? getDistance(location.latitude, location.longitude, b.lat, b.lon)
                      : Number.MAX_VALUE;
                  return distA - distB;
                });
              });
            });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [location, user]);

  useEffect(() => {
    if (keywordTimeout.current) clearTimeout(keywordTimeout.current);

    keywordTimeout.current = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 500);

    return () => {
      if (keywordTimeout.current) clearTimeout(keywordTimeout.current);
    };
  }, [keyword]);

  useEffect(() => {
    AsyncStorage.setItem(
      'savedSearchFilters',
      JSON.stringify({ keyword, distance, selectedCategories })
    );
  }, [keyword, distance, selectedCategories]);

  const animateCategory = (cat: string) => {
    Animated.sequence([
      Animated.timing(animValues[cat], {
        toValue: 1.15,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(animValues[cat], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start();
  };

  const toggleCategory = (cat: string) => {
    animateCategory(cat);
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const clearFilters = () => {
    setKeyword('');
    setDistance(50);
    setSelectedCategories([]);
  };

  useEffect(() => {
    if (!location) {
      setFilteredListings([]);
      return;
    }

    setIsFiltering(true);

    const filtered = listings.filter((listing) => {
      if (
        debouncedKeyword &&
        !(
          listing.title.toLowerCase().includes(debouncedKeyword.toLowerCase()) ||
          listing.description.toLowerCase().includes(debouncedKeyword.toLowerCase())
        )
      ) {
        return false;
      }

      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(listing.category)
      ) {
        return false;
      }

      const distMeters =
        listing.lat && listing.lon
          ? getDistance(location.latitude, location.longitude, listing.lat, listing.lon)
          : Number.MAX_VALUE;

      if (distance > 0 && distMeters > distance * 1000) {
        return false;
      }

      return true;
    });

    setTimeout(() => {
      setFilteredListings(filtered);
      setIsFiltering(false);
    }, 300);
  }, [listings, debouncedKeyword, distance, selectedCategories, location]);

  if (isOffline) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <AppText style={{ color: colors.error, fontSize: 18, marginBottom: 10 }}>
          No internet connection.
        </AppText>
        <AppText style={{ color: colors.textSecondary }}>
          Showing cached listings.
        </AppText>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText style={{ marginTop: 10, color: colors.textPrimary }}>
          Loading listings...
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topRow}>
        <TextInput
          placeholder="Search listings..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.textPrimary, borderColor: colors.border }]}
          value={keyword}
          onChangeText={setKeyword}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        <TouchableOpacity
          onPress={clearFilters}
          style={[styles.clearButton, { backgroundColor: colors.error }]}
        >
          <AppText style={styles.clearButtonText}>Clear</AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.sliderContainer}>
        <AppText style={[styles.sliderLabel, { color: colors.textPrimary }]}>
          Distance: {distance} km
        </AppText>
        <Slider
          minimumValue={1}
          maximumValue={100}
          step={1}
          value={distance}
          onValueChange={setDistance}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          style={{ flex: 1 }}
        />
      </View>

      <View style={styles.categoryContainer}>
        {categories.map((cat) => {
          const selected = selectedCategories.includes(cat);
          return (
            <Animated.View key={cat} style={{ transform: [{ scale: animValues[cat] }] }}>
              <TouchableOpacity
                onPress={() => toggleCategory(cat)}
                style={[
                  styles.categoryButton,
                  selected && { backgroundColor: colors.primary, borderColor: colors.primary },
                  { borderColor: colors.border },
                ]}
              >
                <AppText style={selected ? styles.categoryTextSelected : styles.categoryText}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </AppText>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {isFiltering && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListingCard listing={item} onPress={() => navigation.navigate('ListingDetails', { listingId: item.id })} />
        )}
        contentContainerStyle={{ paddingBottom: 50 }}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  clearButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 40,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderLabel: {
    marginRight: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    justifyContent: 'center',
  },
  categoryButton: {
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 5,
  },
  categoryText: {
    color: '#555',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
