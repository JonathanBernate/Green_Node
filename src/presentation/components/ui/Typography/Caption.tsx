import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { typography } from '@/shared/constants/typography';
import { colors } from '@/shared/constants/colors';

interface CaptionProps {
  children: React.ReactNode;
  color?: string;
  style?: object;
}

export function Caption({ children, color = colors.neutral[600], style }: CaptionProps) {
  return (
    <Text style={[styles.text, { color }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: typography.fontSize.caption,
  },
});
