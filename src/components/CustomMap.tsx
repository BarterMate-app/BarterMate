import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import MapView, { Marker, UrlTile, MapViewProps, Callout } from 'react-native-maps';
import * as FileSystem from 'expo-file-system';

type MarkerType = {
  id?: string | number;
  latitude: number;
  longitude: number;
  title?: string;
  isHighlighted?: boolean;
};

type CustomMapProps = MapViewProps & {
  markers?: MarkerType[];
  highlightMarkerId?: string | number | null;
  onMapPress?: (event: any) => void;
};

export default function CustomMap({
  markers = [],
  highlightMarkerId = null,
  onMapPress,
  ...props
}: CustomMapProps) {
  const tileCachePath = `${FileSystem.cacheDirectory}maptiles`;
  const mapRef = useRef<MapView>(null);

  const bounceAnim = useRef(new Animated.Value(1)).current;
  const animationLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (highlightMarkerId !== null) {
      animationLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animationLoopRef.current.start();

      const marker = markers.find((m) => m.id === highlightMarkerId);
      if (marker && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: marker.latitude,
            longitude: marker.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000
        );
      }
    } else {
      if (animationLoopRef.current) {
        animationLoopRef.current.stop();
        animationLoopRef.current = null;
      }
      bounceAnim.setValue(1);
    }

    return () => {
      if (animationLoopRef.current) {
        animationLoopRef.current.stop();
        animationLoopRef.current = null;
      }
      bounceAnim.setValue(1);
    };
  }, [highlightMarkerId, markers, bounceAnim]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={null} // default provider, can set to 'google' or 'apple' if needed
      mapType="none"
      onPress={onMapPress}
      {...props}
    >
      <UrlTile
        urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maximumZ={19}
        flipY={false}
        tileCachePath={tileCachePath}
        tileCacheMaxAge={604800} // 1 week cache
      />
      {markers.map((marker, index) => {
        const isHighlighted = highlightMarkerId !== null && marker.id === highlightMarkerId;

        return (
          <Marker
            key={marker.id ?? index}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            tracksViewChanges={false}
          >
            <Animated.Image
              source={
                isHighlighted
                  ? require('../../assets/pin-highlighted.png')
                  : require('../../assets/pin-default.png')
              }
              style={[styles.pinImage, isHighlighted && { transform: [{ scale: bounceAnim }] }]}
              resizeMode="contain"
            />
            <Callout tooltip>
              <View style={[styles.calloutContainer, isHighlighted && styles.calloutHighlight]}>
                <Text style={[styles.calloutTitle, isHighlighted && styles.calloutTitleHighlight]}>
                  {marker.title ?? 'Listing'}
                </Text>
              </View>
            </Callout>
          </Marker>
        );
      })}
      {props.children}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  pinImage: {
    width: 40,
    height: 40,
  },
  calloutContainer: {
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 6,
    borderColor: '#ccc',
    borderWidth: 0.5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    minWidth: 120,
  },
  calloutHighlight: {
    borderColor: '#007AFF',
    backgroundColor: '#E6F0FF',
  },
  calloutTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
  },
  calloutTitleHighlight: {
    color: '#007AFF',
  },
});
