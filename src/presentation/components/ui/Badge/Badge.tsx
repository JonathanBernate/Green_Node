import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';
import { dimensions } from '@/shared/constants/dimensions';
import { typography } from '@/shared/constants/typography';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'large';
}

const VARIANT_CONFIG = {
  default: { bg: colors.neutral[200], textColor: colors.neutral[700] },
  success: { bg: '#E8F5E9', textColor: colors.semantic.success },
  warning: { bg: '#FFF3E0', textColor: colors.semantic.warning },
  error: { bg: '#FFEBEE', textColor: colors.semantic.error },
  info: { bg: '#E3F2FD', textColor: colors.semantic.info },
} as const;

export function Badge({
  children,
  variant = 'default',
  size = 'small',
}: BadgeProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <View
      style={[
        styles.container,
        size === 'large' && styles.large,
        { backgroundColor: config.bg },
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'large' && styles.textLarge,
          { color: config.textColor },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: dimensions.borderRadius.full,
  },
  large: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  text: {
    fontSize: typography.fontSize.small,
    fontWeight: '600',
  },
  textLarge: {
    fontSize: typography.fontSize.caption,
  },
});
