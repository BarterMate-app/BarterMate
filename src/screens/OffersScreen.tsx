import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { fetchOffers } from '../services/offersService';

export default function OffersScreen() {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    const data = await fetchOffers();
    setOffers(data);
  };

  return (
    <View style={{ padding: 20 }}>
      <FlatList
        data={offers}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          <Text>{item.message} — Status: {item.status}</Text>
        )}
      />
    </View>
  );
}
