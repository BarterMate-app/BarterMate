import React, { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { signIn } from '../services/authService';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

import ScreenWrapper from '../components/ScreenWrapper';
import AppText from '../components/AppText';
import AppTextInput from '../components/AppTextInput';
import AppButton from '../components/AppButton';

import { colors, spacing, fontSizes, fontWeights } from '../theme';

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signIn(email.trim(), password);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error: any) {
      Alert.alert('Login Error', error.message || 'Failed to login');
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      <AppText style={styles.title}>BarterMate Login</AppText>
      <AppTextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <AppTextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <AppButton title="Login" onPress={handleLogin} />
      <AppButton
        title="Register"
        onPress={() => navigation.navigate('Register')}
        color={colors.textSecondary}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.medium,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSizes.heading1,
    fontWeight: fontWeights.bold as any,
    marginBottom: spacing.large,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.medium,
    borderRadius: 8,
    marginBottom: spacing.medium,
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
});
