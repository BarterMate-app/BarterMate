import React from 'react';
import { Modal, View, StyleSheet, Platform, Text } from 'react-native';
import ScreenWrapper from './ScreenWrapper';
import AppButton from './AppButton';
import * as Network from 'expo-network';
import CustomMap from './CustomMap';

type MapModalProps = {
  visible: boolean;
  initialLocation: { lat: number; lon: number } | null;
  onClose: () => void;
  onLocationSelected: (lat: number, lon: number) => void;
};

export default function MapModal({
  visible,
  initialLocation,
  onClose,
  onLocationSelected,
}: MapModalProps) {
  const [marker, setMarker] = React.useState<{ latitude: number; longitude: number } | null>(
    initialLocation ? { latitude: initialLocation.lat, longitude: initialLocation.lon } : null
  );
  const [isOnline, setIsOnline] = React.useState<boolean>(true);

  // Check network connectivity each time modal opens
  React.useEffect(() => {
    const checkConnection = async () => {
      const status = await Network.getNetworkStateAsync();
      setIsOnline(status.isConnected && status.isInternetReachable);
    };
    if (visible) checkConnection();
  }, [visible]);

  // Reset marker when initialLocation or modal visibility changes
  React.useEffect(() => {
    setMarker(initialLocation ? { latitude: initialLocation.lat, longitude: initialLocation.lon } : null);
  }, [initialLocation, visible]);

  const handlePress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setMarker(coordinate);
  };

  const handleSave = () => {
    if (marker) {
      onLocationSelected(marker.latitude, marker.longitude);
      onClose();
    } else {
      alert('Please select a location on the map.');
    }
  };

  // Show map only if online and on supported platform
  const isMapAvailable = (Platform.OS === 'android' || Platform.OS === 'ios') && isOnline;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScreenWrapper style={{ flex: 1 }}>
        {isMapAvailable ? (
          <>
            <CustomMap
              initialRegion={{
                latitude: initialLocation ? initialLocation.lat : -33.865143,
                longitude: initialLocation ? initialLocation.lon : 151.2099,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              markers={marker ? [{ id: 'selected-marker', ...marker, title: 'Selected Location' }] : []}
              onMapPress={handlePress}
            />
            <View style={styles.buttons}>
              <AppButton title="Cancel" onPress={onClose} />
              <AppButton title="Save Location" onPress={handleSave} />
            </View>
          </>
        ) : (
          <View style={styles.disabled}>
            <Text style={styles.infoText}>
              {Platform.OS === 'ios'
                ? 'Map selection may be unavailable on iOS — using GPS only.'
                : 'Map requires an internet connection.'}
            </Text>
            <AppButton title="Close" onPress={onClose} />
          </View>
        )}
      </ScreenWrapper>
    </Modal>
  );
}

const styles = StyleSheet.create({
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  disabled: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
});
