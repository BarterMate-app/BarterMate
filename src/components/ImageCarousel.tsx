import React from 'react';
import { Dimensions, Image } from 'react-native';
import Carousel from 'react-native-snap-carousel';

export default function ImageCarousel({ images }: { images: string[] }) {
  const { width } = Dimensions.get('window');

  return (
    <Carousel
      data={images}
      renderItem={({ item }) => (
        <Image source={{ uri: item }} style={{ width, height: 220 }} />
      )}
      sliderWidth={width}
      itemWidth={width}
    />
  );
}
