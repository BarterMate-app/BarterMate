import React from 'react';
import { Text, StyleSheet, TextProps, StyleProp, TextStyle } from 'react-native';
import { colors, fontSizes, fontWeights } from '../theme';

interface AppTextProps extends TextProps {
  children: React.ReactNode;
  size?: keyof typeof fontSizes;
  weight?: keyof typeof fontWeights;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export default function AppText({
  children,
  size = 'body',
  weight = 'regular',
  color = colors.textPrimary,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      accessibilityRole="text"
      style={[
        styles.base,
        { fontSize: fontSizes[size], color, fontWeight: fontWeights[weight] },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.textPrimary,
  },
});
