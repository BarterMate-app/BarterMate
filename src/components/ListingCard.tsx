import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function ListingCard({ listing }: { listing: any }) {
  return (
    <View style={styles.card}>
      {listing.image_url && (
        <Image source={{ uri: listing.image_url }} style={styles.image} />
      )}
      <Text style={styles.title}>{listing.title}</Text>
      <Text>{listing.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    margin: 10,
  },
  image: {
    width: '100%',
    height: 150,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
});
