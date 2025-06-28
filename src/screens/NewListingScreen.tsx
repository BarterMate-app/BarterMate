import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { createListing } from '../services/listingsService';
import { saveToStorage, getFromStorage, removeFromStorage } from '../utils/localStorage';

export default function NewListingScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    const draft = await getFromStorage('listingDraft');
    if (draft) {
      setTitle(draft.title);
      setDescription(draft.description);
    }
  };

  const handleSaveDraft = async () => {
    await saveToStorage('listingDraft', { title, description });
    alert('Draft saved!');
  };

  const handlePost = async () => {
    await createListing({ title, description });
    await removeFromStorage('listingDraft');
    alert('Listing created!');
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="Title" style={styles.input} value={title} onChangeText={setTitle} />
      <TextInput placeholder="Description" style={styles.input} value={description} onChangeText={setDescription} />
      <Button title="Post Listing" onPress={handlePost} />
      <Button title="Save Draft" onPress={handleSaveDraft} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  input: { borderWidth: 1, padding: 10, marginBottom: 15 },
});
