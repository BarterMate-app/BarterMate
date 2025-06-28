import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signOut } from '../services/authService';

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  const handleLogout = async () => {
    await signOut();
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to BarterMate</Text>
      <Button title="Browse Listings" onPress={() => navigation.navigate('Listings')} />
      <Button title="New Listing" onPress={() => navigation.navigate('NewListing')} />
      <Button title="Offers" onPress={() => navigation.navigate('Offers')} />
      <Button title="Messages" onPress={() => navigation.navigate('Messages')} />
      <Button title="Trade History" onPress={() => navigation.navigate('TradeHistory')} />
      <Button title="Settings" onPress={() => navigation.navigate('Settings')} />
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, marginBottom: 20, textAlign: 'center' },
});
