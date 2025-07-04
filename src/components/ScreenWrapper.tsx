console.log('ScreenWrapper component loaded');


// src/components/ScreenWrapper.tsx
import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, ViewStyle } from 'react-native';
import { colors, spacing } from '../theme';

type ScreenWrapperProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
};

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, style, scrollable = true }) => {
  if (scrollable) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={[styles.container, style]}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      {children}
    </SafeAreaView>
  );
};

export default ScreenWrapper;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.medium,
  },
});
