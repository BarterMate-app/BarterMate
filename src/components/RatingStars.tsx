import React from 'react';
;

export default function RatingStars({ rating }: { rating: number }) {
  const stars = Array.from({ length: 5 }).map((_, i) => (i < rating ? '★' : '☆'));
  return <AppText>{stars.join(' ')}</AppText>;
}
