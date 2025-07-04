import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent } from 'react-native';
import { buttons, spacing, fontSizes, fontWeights } from '../theme';

type ButtonProps = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: keyof typeof buttons;
  disabled?: boolean;
};

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
}: ButtonProps) {
  const buttonStyle = disabled ? buttons.disabled : buttons[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={title}
      style={[styles.button, { backgroundColor: buttonStyle.backgroundColor }]}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <Text style={[styles.text, { color: buttonStyle.textColor }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: spacing.small,
  },
  text: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
});
