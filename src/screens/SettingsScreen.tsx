import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function SettingsScreen() {
  const handleDarkModeToggle = () => {
    alert('Dark Mode is managed by your phone’s system settings.\n\nTo change it, open your device Display Settings.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Appearance</Text>
        <Button title="Toggle Dark Mode" onPress={handleDarkModeToggle} />
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>More options coming soon…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 30 },
  subtitle: { fontSize: 20, marginBottom: 10 },
});
