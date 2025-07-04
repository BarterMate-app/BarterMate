import React from 'react';
import { TextInput, StyleSheet, TextInputProps, StyleProp, TextStyle } from 'react-native';

interface AppTextInputProps extends TextInputProps {
  style?: StyleProp<TextStyle>;
}

export default function AppTextInput(props: AppTextInputProps) {
  return <TextInput {...props} style={[styles.input, props.style]} />;
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
    color: '#000',
  },
});
