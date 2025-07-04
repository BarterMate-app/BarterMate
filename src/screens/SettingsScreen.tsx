import React from 'react';
import { View, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import AppText from '../components/AppText';
import AppButton from '../components/AppButton';
import { colors, spacing, typography } from '../theme';;

export default function SettingsScreen() {
  const handleDarkModeToggle = () => {
    alert(
      'Dark Mode is managed by your phone’s system settings.\n\nTo change it, open your device Display Settings.'
    );
  };

  return (
    <ScreenWrapper style={styles.container}>
      <AppText style={styles.title}>Settings</AppText>

      <View style={styles.section}>
        <AppText style={styles.subtitle}>Appearance</AppText>
        <AppButton title="Toggle Dark Mode" onPress={handleDarkModeToggle} />
      </View>

      <View style={styles.section}>
        <AppText style={styles.subtitle}>More options coming soon…</AppText>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 10,
  },
});
