import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { typography } from '@/shared/constants/typography';
import { colors } from '@/shared/constants/colors';

interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4;
  color?: string;
  style?: object;
  align?: 'left' | 'center' | 'right';
}

export function Heading({
  children,
  level = 1,
  color = colors.text,
  style,
  align,
}: HeadingProps) {
  const fontSize =
    level === 1
      ? typography.fontSize.h1
      : level === 2
        ? typography.fontSize.h2
        : level === 3
          ? typography.fontSize.h3
          : typography.fontSize.h4;

  return (
    <Text
      style={[
        styles.text,
        { fontSize, color },
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
    fontWeight: '700',
  },
});
