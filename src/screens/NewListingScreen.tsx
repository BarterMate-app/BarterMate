import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Alert,
  Switch,
  Image,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
  Text,
  KeyboardAvoidingView,
  Platform as RNPlatform,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';
import { createListing } from '../services/listingsService';
import { saveToStorage, getFromStorage, removeFromStorage } from '../utils/localStorage';
import CategoryPicker from '../components/CategoryPicker';
import AppText from '../components/AppText';
import AppTextInput from '../components/AppTextInput';
import AppButton from '../components/AppButton';
import ScreenWrapper from '../components/ScreenWrapper';
import { useUser } from '../utils/useUser';
import * as Network from 'expo-network';
import CustomMap from '../components/CustomMap';

const CATEGORIES = [
  'service', 'produce', 'products', 'experiences', 'transport', 'knowledge', 'other', 'home',
];

export default function NewListingScreen() {
  const navigation = useNavigation<any>();
  const user = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('service');
  const [wantedCategory, setWantedCategory] = useState<string | null>(null);
  const [wantedDetails, setWantedDetails] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [canUseMap, setCanUseMap] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const draftSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load draft and location & map availability on mount
  useEffect(() => {
    (async () => {
      try {
        const draft = await getFromStorage('listingDraft');
        if (draft) {
          setTitle(draft.title || '');
          setDescription(draft.description || '');
          setCategory(draft.category || 'service');
          setWantedCategory(draft.wantedCategory ?? null);
          setWantedDetails(draft.wantedDetails || '');
          setIsFree(draft.isFree || false);
          setImageUri(draft.imageUri || null);
          if (draft.lat && draft.lon) setLocation({ lat: draft.lat, lon: draft.lon });
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({});
            setLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
          }
        }

        const networkState = await Network.getNetworkStateAsync();
        setIsOffline(!networkState.isConnected);
        setCanUseMap(
          (Platform.OS === 'android' || Platform.OS === 'ios') &&
          networkState.isConnected &&
          networkState.isInternetReachable
        );
      } catch (err) {
        console.warn('Init error:', err);
      }
    })();
  }, []);

  // Listen to network status changes to update offline state and try uploading draft
  useEffect(() => {
    let subscription: any;
    (async () => {
      const netStatus = await Network.getNetworkStateAsync();
      setIsOffline(!netStatus.isConnected);

      subscription = Network.addNetworkStateListener(({ isConnected }) => {
        setIsOffline(!isConnected);
        if (isConnected) {
          uploadDraftIfAny();
        }
      });
    })();

    return () => {
      if (subscription?.remove) subscription.remove();
    };
  }, []);

  // Save draft to storage (debounced on any change)
  useEffect(() => {
    if (draftSaveTimeout.current) clearTimeout(draftSaveTimeout.current);
    draftSaveTimeout.current = setTimeout(() => {
      saveDraftToStorage();
    }, 1000);
    return () => {
      if (draftSaveTimeout.current) clearTimeout(draftSaveTimeout.current);
    };
  }, [title, description, category, wantedCategory, wantedDetails, isFree, location, imageUri]);

  // Save draft helper
  const saveDraftToStorage = async () => {
    try {
      await saveToStorage('listingDraft', {
        title,
        description,
        category,
        wantedCategory,
        wantedDetails,
        isFree,
        lat: location?.lat,
        lon: location?.lon,
        imageUri,
      });
    } catch (err) {
      console.warn('Failed to save draft:', err);
    }
  };

  // Upload draft from storage if exists
  const uploadDraftIfAny = useCallback(async () => {
    try {
      const draft = await getFromStorage('listingDraft');
      if (!draft) return;

      if (!user) return; // must be logged in

      setPosting(true);

      if (
        !draft.title ||
        !draft.description ||
        !draft.category ||
        !draft.lat ||
        !draft.lon
      ) {
        setPosting(false);
        return; // incomplete draft, keep it saved
      }

      const { error } = await supabase.from('listings').insert({
        title: draft.title,
        description: draft.description,
        category: draft.category,
        wanted_category: draft.wantedCategory,
        wanted_details: draft.wantedDetails,
        is_free: draft.isFree,
        lat: draft.lat,
        lon: draft.lon,
        image_url: draft.imageUri,
        user_id: user.id,
      });

      if (error) {
        console.warn('Draft upload failed:', error);
        setPosting(false);
        return;
      }

      await removeFromStorage('listingDraft');
      setPosting(false);
      Alert.alert('Success', 'Your saved draft was posted automatically.');
      navigation.goBack();
    } catch (err) {
      console.warn('Upload draft error:', err);
      setPosting(false);
    }
  }, [user, navigation]);

  // Manual save draft button handler
  const handleSaveDraft = async () => {
    await saveDraftToStorage();
    Alert.alert('Success', 'Draft saved!');
  };

  // Pick image & upload immediately
  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photos.');
        return;
      }
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (pickerResult.canceled) return;

      const asset = pickerResult.assets[0];
      if (!asset?.uri) {
        Alert.alert('Error', 'Could not select image.');
        return;
      }
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('File too large', 'Please choose an image under 5MB.');
        return;
      }

      setUploading(true);
      const filename = `${Date.now()}-${asset.fileName || asset.uri.split('/').pop()}`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const { error } = await supabase.storage.from('listings').upload(filename, blob, { upsert: true });
      if (error) throw error;
      const { publicUrl } = supabase.storage.from('listings').getPublicUrl(filename).data;
      setImageUri(publicUrl);
    } catch (err) {
      console.error('Image upload failed:', err);
      Alert.alert('Upload failed', 'Could not upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Manual post button handler
  const handlePost = async () => {
    if (!user) {
      Alert.alert('You must be logged in to post a listing.');
      return;
    }
    if (!title || !description) {
      Alert.alert('Missing fields', 'Please fill in both title and description.');
      return;
    }
    if (!location) {
      Alert.alert('Location required', 'Please select your location.');
      return;
    }

    try {
      setPosting(true);
      await createListing({
        title,
        description,
        category,
        wanted_category: wantedCategory,
        wanted_details: wantedDetails,
        is_free: isFree,
        lat: location.lat,
        lon: location.lon,
        image_url: imageUri,
        user_id: user.id,
      });
      await removeFromStorage('listingDraft');
      Alert.alert('Success', 'Listing created!');
      navigation.goBack();
    } catch (err) {
      console.error('Failed to post listing:', err);
      Alert.alert('Error', 'Could not create listing. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <AppTextInput placeholder="Title" style={styles.input} value={title} onChangeText={setTitle} />
          <AppTextInput
            placeholder="Description"
            style={[styles.input, { height: 100 }]}
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <AppText style={styles.label}>Category</AppText>
          <CategoryPicker categories={CATEGORIES} selected={category} onSelect={setCategory} />

          <AppText style={styles.label}>Wanted Category (optional)</AppText>
          <CategoryPicker
            categories={['none', ...CATEGORIES]}
            selected={wantedCategory || 'none'}
            onSelect={(val) => setWantedCategory(val === 'none' ? null : val)}
          />

          {wantedCategory && wantedCategory !== 'none' && (
            <AppTextInput
              placeholder="Details of what you want in return"
              style={styles.input}
              value={wantedDetails}
              onChangeText={setWantedDetails}
            />
          )}

          <View style={styles.switchContainer}>
            <AppText style={{ fontSize: 16 }}>Offer for Free</AppText>
            <Switch value={isFree} onValueChange={setIsFree} />
          </View>

          {canUseMap ? (
            <AppButton title="Pick Location on Map" onPress={() => setShowMap(true)} />
          ) : (
            <AppText style={{ marginVertical: 10, fontStyle: 'italic', color: 'gray' }}>
              Map picking unavailable or offline. Using GPS coordinates.
            </AppText>
          )}

          {location && (
            <AppText style={{ marginTop: 5 }}>
              Location: {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
            </AppText>
          )}

          <View style={{ marginVertical: 10 }}>
            <AppButton title={uploading ? 'Uploading...' : 'Pick Image'} onPress={handlePickImage} disabled={uploading} />
            {imageUri && <Image source={{ uri: imageUri }} style={styles.imagePreview} />}
          </View>

          <AppButton title="Save Draft" onPress={handleSaveDraft} disabled={posting || uploading} />
          <View style={{ marginTop: 10 }} />
          <AppButton title={posting ? 'Posting...' : 'Post Listing'} onPress={handlePost} color="green" disabled={posting || uploading} />

          <Modal visible={showMap} animationType="slide" onRequestClose={() => setShowMap(false)}>
            <ScreenWrapper style={{ flex: 1 }}>
              {location && (
                <CustomMap
                  initialRegion={{
                    latitude: location.lat,
                    longitude: location.lon,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  markers={[{ latitude: location.lat, longitude: location.lon, title: 'Selected' }]}
                  onPress={(e) => {
                    const coord = e.nativeEvent.coordinate;
                    setLocation({ lat: coord.latitude, lon: coord.longitude });
                  }}
                />
              )}
              <View style={styles.mapButtons}>
                <AppButton title="Cancel" onPress={() => setShowMap(false)} />
                <AppButton title="Save Location" onPress={() => setShowMap(false)} />
              </View>
            </ScreenWrapper>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
  label: { fontSize: 16, marginBottom: 5, fontWeight: '600' },
  switchContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 15,
  },
  imagePreview: { width: '100%', height: 200, marginTop: 10, borderRadius: 8 },
  mapButtons: { flexDirection: 'row', justifyContent: 'space-around', padding: 10 },
});
