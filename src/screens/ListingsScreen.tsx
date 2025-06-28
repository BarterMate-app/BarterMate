import React, { useEffect, useState } from 'react';
import { View, FlatList, Button } from 'react-native';
import * as Location from 'expo-location';
import { getDistance } from '../utils/distanceCalculator';
import { fetchListings } from '../services/listingsService';
import ListingCard from '../components/ListingCard';
import { saveToStorage, getFromStorage } from '../utils/localStorage';

export default function ListingsScreen() {
  const [listings, setListings] = useState([]);
  const [location, setLocation] = useState<any>(null);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    const { coords } = await Location.getCurrentPositionAsync({});
    setLocation(coords);

    const data = await fetchListings();

    const sorted = data.sort((a: any, b: any) => {
      const distA = getDistance(coords.latitude, coords.longitude, a.lat, a.lon);
      const distB = getDistance(coords.latitude, coords.longitude, b.lat, b.lon);
      return distA - distB;
    });
    setListings(sorted);
  };

  const handleSaveTrade = async (listing: any) => {
    const wishlist = (await getFromStorage('wishlist')) || [];
    wishlist.push(listing);
    await saveToStorage('wishlist', wishlist);
    alert('Added to Wishlist!');
  };

  return (
    <View>
      <FlatList
        data={listings}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          <View>
            <ListingCard listing={item} />
            <Button title="Add to Wishlist" onPress={() => handleSaveTrade(item)} />
          </View>
        )}
      />
    </View>
  );
}
