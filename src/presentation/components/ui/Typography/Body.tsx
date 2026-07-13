import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { typography } from '@/shared/constants/typography';
import { colors } from '@/shared/constants/colors';

interface BodyProps {
  children: React.ReactNode;
  color?: string;
  fontWeight?: TextStyle['fontWeight'];
  style?: object;
  align?: 'left' | 'center' | 'right';
}

export function Body({
  children,
  color = colors.neutral[800],
  fontWeight = '400',
  style,
  align,
}: BodyProps) {
  return (
    <Text
      style={[
        styles.text,
        { color, fontWeight },
        align && { textAlign: align },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
  },
});
