import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabase';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../utils/useUser';

import AppText from '../components/AppText';
import AppTextInput from '../components/AppTextInput';
import AppButton from '../components/AppButton';
import { colors, spacing, textStyles } from '../theme';

export default function EditProfileScreen() {
  const user = useUser();
  const navigation = useNavigation();
  const [bio, setBio] = useState(user?.bio || '');
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(user?.profile_picture_url || null);

  if (!user) return null;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!result.cancelled) {
      uploadImage(result.uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop();
      const filePath = `${user.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { publicURL, error: urlError } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      if (urlError) throw urlError;

      setProfileImage(publicURL);
      await supabase
        .from('users')
        .update({ profile_picture_url: publicURL })
        .eq('id', user.id);

      Alert.alert('Success', 'Profile image updated.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    const { error } = await supabase
      .from('users')
      .update({ bio })
      .eq('id', user.id);

    if (error) {
      Alert.alert('Error', 'Failed to update profile.');
    } else {
      Alert.alert('Success', 'Profile updated.');
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <AppText style={textStyles.heading2}>Edit Profile</AppText>

      <Image
        source={
          profileImage
            ? { uri: profileImage }
            : require('../../assets/default-avatar.png')
        }
        style={styles.avatar}
      />

      {uploading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <AppButton title="Change Profile Photo" onPress={pickImage} />
      )}

      <AppText style={styles.label}>Bio</AppText>
      <AppTextInput
        value={bio}
        onChangeText={setBio}
        placeholder="Tell people about yourself..."
        multiline
        style={styles.input}
      />

      <AppButton title="Save" onPress={saveProfile} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.medium,
    flex: 1,
    backgroundColor: colors.background,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: spacing.medium,
  },
  label: {
    marginTop: spacing.large,
    marginBottom: spacing.small,
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.medium,
    borderRadius: 5,
    minHeight: 80,
    textAlignVertical: 'top',
    color: colors.textPrimary,
  },
});
