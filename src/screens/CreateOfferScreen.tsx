import React, { useState } from 'react';
import {
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useUser } from '../utils/useUser';
import { createOffer } from '../services/offersService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import AppText from '../components/AppText';
import AppTextInput from '../components/AppTextInput';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateOffer'>;

export default function CreateOfferScreen({ route, navigation }: Props) {
  const { listingId, recipientId } = route.params;
  const user = useUser();

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <View style={styles.center}>
        <AppText>Please log in to make an offer.</AppText>
      </View>
    );
  }

  const handleCreateOffer = async () => {
    if (!message.trim()) {
      Alert.alert('Validation', 'Please enter a message for your offer.');
      return;
    }
    setLoading(true);
    try {
      await createOffer({
        listing_id: listingId,
        proposer_id: user.id,
        recipient_id: recipientId,
        message: message.trim(),
      });
      Alert.alert('Success', 'Offer sent successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('CreateOffer error:', error);
      Alert.alert('Error', 'Failed to send offer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <AppText style={styles.label}>Offer Message</AppText>
        <AppTextInput
          placeholder="Type your message..."
          value={message}
          onChangeText={setMessage}
          multiline
          style={styles.input}
          maxLength={500}
          textAlignVertical="top"
          editable={!loading}
        />
        <AppText style={styles.charCount}>{message.length} / 500</AppText>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreateOffer}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <AppText style={styles.buttonText}>Send Offer</AppText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 20, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    minHeight: 140,
    backgroundColor: '#fff',
  },
  charCount: { alignSelf: 'flex-end', marginVertical: 8, color: '#777' },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: { backgroundColor: '#8bbcfb' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
