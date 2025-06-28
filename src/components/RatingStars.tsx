import React from 'react';
import { Text } from 'react-native';

export default function RatingStars({ rating }: { rating: number }) {
  const stars = Array.from({ length: 5 }).map((_, i) => (i < rating ? '★' : '☆'));
  return <Text>{stars.join(' ')}</Text>;
}
